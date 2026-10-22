#!/usr/bin/env node
import { StringDecoder } from 'node:string_decoder'
import { createCipheriv, pbkdf2Sync, randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

export function encryptPrivateJson(jsonText, password) {
  if (password.length < 12) throw new Error('请使用至少 12 个字符的长密码。')
  const salt = randomBytes(16)
  const iv = randomBytes(12)
  const key = pbkdf2Sync(password, salt, 310000, 32, 'sha256')
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(jsonText, 'utf8'), cipher.final(), cipher.getAuthTag()])
  key.fill(0)
  return {
    version: 1,
    kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: 310000, salt: salt.toString('base64') },
    cipher: { name: 'AES-GCM', bits: 256, iv: iv.toString('base64') },
    ciphertext: encrypted.toString('base64')
  }
}

async function readMaskedPassword(prompt) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') throw new Error('请在可交互的本地终端运行此命令。')
  process.stdout.write(prompt)
  process.stdin.setRawMode(true)
  process.stdin.resume()
  const decoder = new StringDecoder('utf8')
  let value = ''
  return new Promise((resolvePassword, reject) => {
    const finish = (error) => {
      process.stdin.off('data', onData)
      process.stdin.setRawMode(false)
      process.stdin.pause()
      process.stdout.write('\n')
      if (error) reject(error)
      else resolvePassword(value)
    }
    const onData = (chunk) => {
      const input = decoder.write(chunk)
      for (const character of input) {
        if (character === '\u0003') return finish(new Error('已取消。'))
        if (character === '\r' || character === '\n') return finish()
        if (character === '\u007f' || character === '\b') {
          if (value.length) {
            value = Array.from(value).slice(0, -1).join('')
            process.stdout.write('\b \b')
          }
          continue
        }
        value += character
        process.stdout.write('*')
      }
    }
    process.stdin.on('data', onData)
  })
}

async function main() {
  const args = process.argv.slice(2)
  let inputArg
  let outputArg
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--output') {
      if (!args[index + 1]) throw new Error('--output 后需要提供目标文件路径。')
      outputArg = args[++index]
    }
    else if (!args[index].startsWith('--') && !inputArg) inputArg = args[index]
    else throw new Error(`无法识别参数：${args[index]}`)
  }
  const inputPath = resolve(inputArg || resolve(root, 'private-data/memories.json'))
  if (outputArg === '') throw new Error('--output 后需要提供目标文件路径。')
  const outputPath = resolve(outputArg || resolve(root, 'docs/public/private/memories.enc.json'))
  if (!existsSync(inputPath)) throw new Error(`找不到本地明文数据文件：${inputPath}`)
  const data = JSON.parse(readFileSync(inputPath, 'utf8'))
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('数据文件必须是 JSON 对象。')
  if (Array.isArray(data.photos)) {
    data.photos = data.photos.map((photo) => {
      if (!photo || typeof photo !== 'object' || Array.isArray(photo)) throw new Error('每张照片都必须是对象。')
      if (typeof photo.alt !== 'string' || !photo.alt.trim()) throw new Error('每张照片都需要填写 alt 描述。')
      if (typeof photo.file !== 'string') {
        if (typeof photo.src !== 'string' || !/^data:image\/(?:png|jpe?g|webp|gif|avif);base64,[a-z0-9+/]+=*$/i.test(photo.src)) {
          throw new Error(`照片“${photo.alt}”必须使用本地 file 路径或 Base64 图片数据。`)
        }
        return photo
      }
      const imagePath = resolve(dirname(inputPath), photo.file)
      const pathFromInput = relative(dirname(inputPath), imagePath)
      if (pathFromInput === '..' || pathFromInput.startsWith(`..${sep}`) || pathFromInput.startsWith(sep) || /^[a-z]:/i.test(pathFromInput)) {
        throw new Error(`照片必须放在加密数据文件所在目录中：${photo.file}`)
      }
      if (!existsSync(imagePath)) throw new Error(`找不到照片文件：${imagePath}`)
      const extension = extname(imagePath).toLowerCase()
      const mime = ({ '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif' })[extension]
      if (!mime) throw new Error(`不支持的照片格式：${extension || '(无扩展名)'}`)
      const image = readFileSync(imagePath)
      const { file, ...details } = photo
      return { ...details, src: `data:${mime};base64,${image.toString('base64')}` }
    })
  }
  const source = JSON.stringify(data)
  let password = await readMaskedPassword('设置加密密码（输入内容会以星号遮挡）：')
  let confirmation = await readMaskedPassword('再次输入加密密码：')
  if (password !== confirmation) throw new Error('两次输入的密码不一致。')
  const envelope = encryptPrivateJson(source, password)
  password = ''
  confirmation = ''
  const output = `${JSON.stringify(envelope)}\n`
  const outputDirectory = dirname(outputPath)
  mkdirSync(outputDirectory, { recursive: true })
  if (existsSync(outputPath)) {
    const backupDirectory = resolve(root, 'private-data/encrypted-backups')
    mkdirSync(backupDirectory, { recursive: true })
    const backupPath = resolve(backupDirectory, `${basename(outputPath)}.${new Date().toISOString().replaceAll(':', '-')}.bak`)
    renameSync(outputPath, backupPath)
    try {
      writeFileSync(outputPath, output, { flag: 'wx' })
    } catch (error) {
      renameSync(backupPath, outputPath)
      throw error
    }
    process.stdout.write(`已生成加密文件；旧文件已备份到本地忽略目录。\n`)
  } else {
    writeFileSync(outputPath, output, { flag: 'wx' })
    process.stdout.write(`已生成加密文件：${outputPath}\n`)
  }
  process.stdout.write('明文路径不会自动复制到站点目录；请确认仅加密文件进入版本控制。\n')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 1
  })
}
