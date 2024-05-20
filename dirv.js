export class Dirv {
	constructor(dir) {
		this.dir = dir
	}
	// return path directory names array and last part (file/folder) tuple
	async dirHandleAndNameFromPath(pathStrig) {
		const path = pathStrig.split('/')
		const name = path.pop()
		let dirHandle = this.dir
		for (const dirName of path) {
			dirHandle = await dirHandle.getDirectoryHandle(dirName)
		}
		return [dirHandle, name]
	}
	// return file handle for given file path
	async fileHandleFromPath(filePath, opts) {
		const [dirHandle, name] = await this.dirHandleAndNameFromPath(filePath)
		return await dirHandle.getFileHandle(name, opts)
	}
	// return dir handle for given file path
	async dirPathHandle(dirPath) {
		const [dirHandle, name] = await this.dirHandleAndNameFromPath(dirPath)
		return await dirHandle.getDirectoryHandle(name)
	}
	// simplest way to read a top level file
	async read(fileName, opts = {}) {
		const fileHandle = await this.dir.getFileHandle(fileName, opts)
		const file = await fileHandle.getFile()
		return await file.text()
	}
	// simplest way to write to a top level file
	async write(fileName, content = '', opts = { create: true }) {
		// no opts.create will rise error when writing to a nonexistent file
		const fileHandle = await this.dir.getFileHandle(fileName, opts)
		const writable = await fileHandle.createWritable()
		await writable.write(content)
		await writable.close()
		return fileHandle
	}
	// read a file by its path and return text string
	async r(filePath) {
		const fileHandle = await this.fileHandleFromPath(filePath)
		const file = await fileHandle.getFile()
		return await file.text()
	}
	// write to a file by its path (doesn't create directories. see touch)
	async w(filePath, contents = '') {
		const fileHandle = await this.fileHandleFromPath(filePath, { create: true })
		const writable = await fileHandle.createWritable()
		await writable.write(contents)
		await writable.close() // Close the file and write the contents to disk.
	}
	// create all subdirectories.
	async mkdirAll(pathToDir, opts = {}) {
		const path = pathToDir.split('/')
		let dirHandle = this.dir
		for (const dirName of path) {
			dirHandle = await dirHandle.getDirectoryHandle(dirName, {
				...opts,
				create: true,
			})
		}
		return dirHandle // no need cuz we didn't .pop() so it went in fors
	}
	// pass "file" or "directory" to filter handles
	async _ls(kind = null){
		const arr = []
		for await (const p of this.dir.values()) arr.push(p)
		if (kind) return arr.filter(handle => handle.kind == kind)
		return arr
	}
	// same with _ls but returns names
	async ls(kind = null) {
		return (await this._ls(kind)).map(handle=>handle.name)
	}
	async remove(fileName, opts = {}) {
		const fileHandle = await this.dir.getFileHandle(fileName, opts)
		return await fileHandle.remove()
	}
	/* -------- Above Is Tested --------  */
	// mkdirAll but last part is file. unlike w, it creates all sub directories.
	async touch(pathToFile, contents = '') {
		const path = pathToFile.split('/')
		const name = path.pop()
		const pathToDir = path.join('/')
		const dirHandle = await this.mkdirAll(pathToDir)
	}
	// a shortcut to extract sub dir Dirv with deconstructing. to get "sub" dir:
	// const { sub } = dirvParentOfSub
	get sub() {
		return new Proxy(
			{},
			{
				get(_, dirName) {
					return new Promis(async function (res, rej) {
						try {
							res(await this.cd(dirName))
						} catch (err) {
							rej(err)
						}
					})
				},
			}
		)
	}
	async files() {
		// returns { ChildDirName, Dirv }[]
		return {}
	}
	async cd() {
		return new Dirv(await this._cd(...arguments))
	}
	async _cd(dirName, opts = {}) {
		return await this.dir.getDirectoryHandle(dirName, opts)
	}
	async mkdir(dirName, opts = {}) {
		await this.cd(dirName, { ...opts, create: true })
	}
	async delete() {} // removes for itself. no argument needed
	async copy(path1, path2) {}
	async move(path1, path2) {}
	async has(fileOrDirName) {
		// just like exists but only top level
	}
	async exists(filePath) {
		// ...
		return null
		return "file"
		return "directory"
	}
	async hasFile(fileName) {}
	async hasDir(dirName) {}
}

export async function dirv(dir = null) {
	return new Dirv(
		dir ||
			(await window.showDirectoryPicker({
				mode: 'readwrite',
				// startIn: 'desktop',
			}))
	)
}
