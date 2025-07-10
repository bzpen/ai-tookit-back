import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);

export class FileUtil {
  /**
   * 检查文件是否存在
   */
  static async exists(filePath: string): Promise<boolean> {
    try {
      await stat(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 读取文件内容
   */
  static async readFile(filePath: string, encoding: BufferEncoding = 'utf8'): Promise<string> {
    return await readFile(filePath, encoding);
  }

  /**
   * 写入文件内容
   */
  static async writeFile(filePath: string, data: string, encoding: BufferEncoding = 'utf8'): Promise<void> {
    await writeFile(filePath, data, encoding);
  }

  /**
   * 删除文件
   */
  static async deleteFile(filePath: string): Promise<void> {
    await unlink(filePath);
  }

  /**
   * 创建目录
   */
  static async createDirectory(dirPath: string): Promise<void> {
    await mkdir(dirPath, { recursive: true });
  }

  /**
   * 获取文件信息
   */
  static async getFileInfo(filePath: string): Promise<{
    size: number;
    birthtime: Date;
    mtime: Date;
    isFile: boolean;
    isDirectory: boolean;
  }> {
    const stats = await stat(filePath);
    return {
      size: stats.size,
      birthtime: stats.birthtime,
      mtime: stats.mtime,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory()
    };
  }

  /**
   * 获取目录下的文件列表
   */
  static async getFileList(dirPath: string): Promise<string[]> {
    return await readdir(dirPath);
  }

  /**
   * 获取文件扩展名
   */
  static getFileExtension(filePath: string): string {
    return path.extname(filePath).toLowerCase();
  }

  /**
   * 获取文件名（不包含扩展名）
   */
  static getFileNameWithoutExtension(filePath: string): string {
    return path.basename(filePath, path.extname(filePath));
  }

  /**
   * 获取文件名（包含扩展名）
   */
  static getFileName(filePath: string): string {
    return path.basename(filePath);
  }

  /**
   * 获取文件目录
   */
  static getFileDirectory(filePath: string): string {
    return path.dirname(filePath);
  }

  /**
   * 拼接路径
   */
  static joinPath(...paths: string[]): string {
    return path.join(...paths);
  }

  /**
   * 解析路径
   */
  static parsePath(filePath: string): {
    dir: string;
    base: string;
    name: string;
    ext: string;
  } {
    return path.parse(filePath);
  }

  /**
   * 生成唯一文件名
   */
  static generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = this.getFileExtension(originalName);
    const nameWithoutExt = this.getFileNameWithoutExtension(originalName);
    
    return `${nameWithoutExt}_${timestamp}_${randomString}${extension}`;
  }

  /**
   * 验证文件类型
   */
  static validateFileType(fileName: string, allowedTypes: string[]): boolean {
    const extension = this.getFileExtension(fileName);
    return allowedTypes.includes(extension);
  }

  /**
   * 验证文件大小
   */
  static validateFileSize(fileSize: number, maxSize: number): boolean {
    return fileSize <= maxSize;
  }

  /**
   * 格式化文件大小
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 获取文件MD5哈希
   */
  static async getFileMD5(filePath: string): Promise<string> {
    const fileBuffer = await readFile(filePath);
    const hash = crypto.createHash('md5');
    hash.update(fileBuffer);
    return hash.digest('hex');
  }

  /**
   * 获取文件SHA256哈希
   */
  static async getFileSHA256(filePath: string): Promise<string> {
    const fileBuffer = await readFile(filePath);
    const hash = crypto.createHash('sha256');
    hash.update(fileBuffer);
    return hash.digest('hex');
  }

  /**
   * 复制文件
   */
  static async copyFile(source: string, destination: string): Promise<void> {
    const data = await readFile(source);
    await writeFile(destination, data);
  }

  /**
   * 移动文件
   */
  static async moveFile(source: string, destination: string): Promise<void> {
    await this.copyFile(source, destination);
    await this.deleteFile(source);
  }

  /**
   * 清理临时文件
   */
  static async cleanupTempFiles(tempDir: string, olderThan: number = 24 * 60 * 60 * 1000): Promise<void> {
    const files = await this.getFileList(tempDir);
    const now = Date.now();
    
    for (const file of files) {
      const filePath = this.joinPath(tempDir, file);
      const fileInfo = await this.getFileInfo(filePath);
      
      if (now - fileInfo.mtime.getTime() > olderThan) {
        await this.deleteFile(filePath);
      }
    }
  }

  /**
   * 获取允许的图片类型
   */
  static getAllowedImageTypes(): string[] {
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  }

  /**
   * 获取允许的文档类型
   */
  static getAllowedDocumentTypes(): string[] {
    return ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf'];
  }

  /**
   * 获取允许的音频类型
   */
  static getAllowedAudioTypes(): string[] {
    return ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'];
  }

  /**
   * 获取允许的视频类型
   */
  static getAllowedVideoTypes(): string[] {
    return ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'];
  }

  /**
   * 检查是否为图片文件
   */
  static isImageFile(fileName: string): boolean {
    return this.validateFileType(fileName, this.getAllowedImageTypes());
  }

  /**
   * 检查是否为文档文件
   */
  static isDocumentFile(fileName: string): boolean {
    return this.validateFileType(fileName, this.getAllowedDocumentTypes());
  }

  /**
   * 检查是否为音频文件
   */
  static isAudioFile(fileName: string): boolean {
    return this.validateFileType(fileName, this.getAllowedAudioTypes());
  }

  /**
   * 检查是否为视频文件
   */
  static isVideoFile(fileName: string): boolean {
    return this.validateFileType(fileName, this.getAllowedVideoTypes());
  }

  /**
   * 获取文件MIME类型
   */
  static getMimeType(fileName: string): string {
    const extension = this.getFileExtension(fileName);
    const mimeTypes: Record<string, string> = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.txt': 'text/plain',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.zip': 'application/zip',
      '.rar': 'application/vnd.rar',
      '.7z': 'application/x-7z-compressed'
    };
    
    return mimeTypes[extension] || 'application/octet-stream';
  }

  /**
   * 创建文件上传配置
   */
  static createUploadConfig(options: {
    maxSize?: number;
    allowedTypes?: string[];
    uploadDir?: string;
    generateUniqueName?: boolean;
  } = {}): {
    maxSize: number;
    allowedTypes: string[];
    uploadDir: string;
    generateUniqueName: boolean;
  } {
    return {
      maxSize: options.maxSize || 10 * 1024 * 1024, // 10MB
      allowedTypes: options.allowedTypes || this.getAllowedImageTypes(),
      uploadDir: options.uploadDir || 'uploads',
      generateUniqueName: options.generateUniqueName !== false
    };
  }

  /**
   * 验证上传文件
   */
  static validateUploadFile(file: {
    originalname: string;
    size: number;
    mimetype: string;
  }, config: {
    maxSize: number;
    allowedTypes: string[];
  }): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // 验证文件类型
    if (!this.validateFileType(file.originalname, config.allowedTypes)) {
      errors.push(`不支持的文件类型: ${this.getFileExtension(file.originalname)}`);
    }
    
    // 验证文件大小
    if (!this.validateFileSize(file.size, config.maxSize)) {
      errors.push(`文件大小超过限制: ${this.formatFileSize(file.size)} > ${this.formatFileSize(config.maxSize)}`);
    }
    
    // 验证文件名
    if (!file.originalname || file.originalname.trim() === '') {
      errors.push('文件名不能为空');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 处理文件上传
   */
  static async handleFileUpload(file: {
    originalname: string;
    size: number;
    mimetype: string;
    buffer: Buffer;
  }, config: {
    maxSize: number;
    allowedTypes: string[];
    uploadDir: string;
    generateUniqueName: boolean;
  }): Promise<{
    success: boolean;
    filePath?: string;
    fileName?: string;
    fileSize?: number;
    errors?: string[];
  }> {
    // 验证文件
    const validation = this.validateUploadFile(file, config);
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors
      };
    }
    
    try {
      // 确保上传目录存在
      await this.createDirectory(config.uploadDir);
      
      // 生成文件名
      const fileName = config.generateUniqueName
        ? this.generateUniqueFileName(file.originalname)
        : file.originalname;
      
      // 生成文件路径
      const filePath = this.joinPath(config.uploadDir, fileName);
      
      // 写入文件
      await writeFile(filePath, file.buffer);
      
      return {
        success: true,
        filePath,
        fileName,
        fileSize: file.size
      };
    } catch (error) {
      return {
        success: false,
        errors: [`文件上传失败: ${error instanceof Error ? error.message : '未知错误'}`]
      };
    }
  }

  /**
   * 获取文件下载信息
   */
  static async getDownloadInfo(filePath: string): Promise<{
    exists: boolean;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    lastModified?: Date;
  }> {
    const exists = await this.exists(filePath);
    
    if (!exists) {
      return { exists: false };
    }
    
    const fileInfo = await this.getFileInfo(filePath);
    const fileName = this.getFileName(filePath);
    const mimeType = this.getMimeType(fileName);
    
    return {
      exists: true,
      fileName,
      fileSize: fileInfo.size,
      mimeType,
      lastModified: fileInfo.mtime
    };
  }

  /**
   * 清理文件名（移除非法字符）
   */
  static sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9._\-\u4e00-\u9fa5]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * 检查文件路径是否安全
   */
  static isSafeFilePath(filePath: string, allowedDir: string): boolean {
    const normalizedPath = path.normalize(filePath);
    const normalizedAllowedDir = path.normalize(allowedDir);
    
    return normalizedPath.startsWith(normalizedAllowedDir + path.sep) ||
           normalizedPath === normalizedAllowedDir;
  }

  /**
   * 生成文件URL
   */
  static generateFileUrl(filePath: string, baseUrl: string): string {
    const relativePath = filePath.replace(/\\/g, '/');
    return `${baseUrl}/${relativePath}`;
  }

  /**
   * 获取文件统计信息
   */
  static async getDirectoryStats(dirPath: string): Promise<{
    totalFiles: number;
    totalSize: number;
    fileTypes: Record<string, number>;
  }> {
    const files = await this.getFileList(dirPath);
    let totalFiles = 0;
    let totalSize = 0;
    const fileTypes: Record<string, number> = {};
    
    for (const file of files) {
      const filePath = this.joinPath(dirPath, file);
      const fileInfo = await this.getFileInfo(filePath);
      
      if (fileInfo.isFile) {
        totalFiles++;
        totalSize += fileInfo.size;
        
        const extension = this.getFileExtension(file);
        fileTypes[extension] = (fileTypes[extension] || 0) + 1;
      }
    }
    
    return {
      totalFiles,
      totalSize,
      fileTypes
    };
  }

  /**
   * 批量删除文件
   */
  static async deleteFiles(filePaths: string[]): Promise<{
    success: number;
    failed: number;
    errors: string[];
  }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];
    
    for (const filePath of filePaths) {
      try {
        await this.deleteFile(filePath);
        success++;
      } catch (error) {
        failed++;
        errors.push(`删除文件 ${filePath} 失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
    
    return {
      success,
      failed,
      errors
    };
  }
} 