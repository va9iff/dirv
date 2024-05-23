export class Dirv {
	constructor(dir) {
		this.dir = dir
	}
	// returns file handle
	async take(fileName, create = false) {
		return await this.dir.getFileHandle(fileName, { create })
	}
	// returns sub directory handle
	async _cd(dirName, create = false) {
		return await this.dir.getDirectoryHandle(dirName, { create })
	}
	// pass "file" or "directory" to filter handles
	async _ls(kind = null){
		const arr = []
		for await (const p of this.dir.values()) arr.push(p)
		if (kind) return arr.filter(handle => handle.kind == kind)
		return arr
	}
	async remove(fileName) {
		const fileHandle = await this.take(fileName)
		return await fileHandle.remove()
	}
	// _cd returning Dirv instead of dir handle
	async cd(dirName, create = false) {
		return new Dirv(await this._cd(dirName, { create }))
	}
	// simplest way to read a top level file
	async read(fileName, create) {
		const fileHandle = await this.take(fileName, create)
		const file = await fileHandle.getFile()
		return await file.text()
	}
	// simplest way to write to a top level file
	async write(fileName, content = '') {
		const fileHandle = await this.take(fileName, true)
		const writable = await fileHandle.createWritable()
		await writable.write(content)
		await writable.close()
		return fileHandle
	}
	/* ---- methods using path ---- */
	// returns path dirv and last part's (file or folder) name string tuple.
	async dirOf(fullPath, create = false) {
		const pathArray = fullPath.split('/')
		const name = pathArray.pop()
		let current = this
		for (const dirName of pathArray)
			current = await current.cd(dirName, create)
		return [current, name]
	}
	// cd by full path to directory
	async goto(dirFullPath, create = false) {
		const [dirPath, dirName] = await this.dirOf(dirFullPath, create)
		return await dirPath.cd(dirName, create)
	}
	// returns file handle for given file path (expects path to exist)
	async reach(fileFullPath, create = false) {
		const [filePath, fileName] = await this.dirOf(fileFullPath)
		return await filePath.take(fileName, create)
	}
	// read a file by its path and return text string
	async r(fileFullPath, create) {
		const [filePath, fileName] = await this.dirOf(fileFullPath)
		return await filePath.read(fileName, create)
	}
	// write to a file by its path
	async w(fileFullPath, contents = '', createPath = false) {
		const [filePath, fileName] = await this.dirOf(fileFullPath, createPath)
		return await filePath.write(ffileName, content)
	}
	// create a directory and return its Dirv
	async mkdir(dirName) {
		return await this.cd(dirName, true)
	} 
	// create all sub directories
	async mkdirAll(dirFullPath) {
		return await this.goto(dirFullPath, true)
	}
	// same with _ls but returns names
	async ls(kind = null) {
		return (await this._ls(kind)).map(handle=>handle.name)
	}
	// return { dirName1: dirv, ... } for sub directories
	async dirs() {
		// ! not tested
		const dirMap = {}
		const dirs = await this.ls("directory")
		for (const dirName of dirs) {
			dirMap[dirName] = await this.cd(dirName)
		}
	}
	// returns true if has the file, false if not
	async hasFile(fileName) {
		// !!! instead of listing all files, use getFileHandle and
		// !!! catch for not found error by returning false. if goes well, true.
		return (await this.ls("file")).includes(fileName)
	}
	// returns true if has the directory, false if not
	async hasDir(dirName) {
		return (await this.ls("directory")).includes(dirName)
	}
	// returns boolean. "name" for a file, "name/" for a directory
	async has(name) {
		if (name.at(-1) == "/")
			return await this.hasDir(name.split(0, -1))
		return await this.hasFile(name)
	}
	async exists(fullPath) {
		const [path, name] = await this.dirOf(fullPath)
		await path.has(name)
	}
	// async copy(path1, path2) {}
	// async move(path1, path2) {}
	// async delete() {} // removes for itself

	// read a file. if don't exist, write default content and return to it.
	async either(fileFullPath, content = "") {
		const [dirPath, fileName] = await this.dirOf(fileFullPath, true)
		if (await dirPath.hasFile(fileName)) return await dirPath.read(fileName)
		await dirPath.write(fileName, content)
		return content
	}
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
