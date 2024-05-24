export class Dirv {
	constructor(dir) {
		this.dir = dir
	}
	static async pick(opts = { mode: 'readwrite' }) {
		const dirHandle = await window.showDirectoryPicker(opts)
		return new Dirv(dirHandle)
	}
	// key to save directory handle when .saveSession is used with no argument
	static defaultKey = "dirv-default"
	// save dir handle to load in the later sessions
	async saveSession(key = this.defaultKey) {
		return new Promise((res,rej)=>{
			const dataToSave = this.dir;
			const request = indexedDB.open("dirvdb", 4);
			request.onsuccess = function(event) {
			    const db = event.target.result;
			    const transaction = db.transaction(["dirvs"], "readwrite");
			    const objectStore = transaction.objectStore("dirvs");
			    const putterRequest = objectStore.put(dataToSave, key);
			    putterRequest.onsuccess = function(event) {
				    console.log(`saved Dirv "${key}"`, dataToSave)
			    };
			    putterRequest.onerror = function(event) {
			        console.error("Error saving data:", event.target.error);
			    };
			};
			request.onerror = function(event) {
			    console.error("Error opening database:", event.target.error);
			};
			// Event handler for database version change (initial creation or upgrade)
			request.onupgradeneeded = function(event) {
			    const db = event.target.result;
				if (!db.objectStoreNames.contains("dirvs")) {
				    db.createObjectStore("dirvs");
				}
			};

		})
	}
	// get last .saveSession called dirv (or by key).
	// loads last dirHandle, requires permission and returns to a Dirv.
	static async want(key = this.defaultKey) {
		const SelfConstructor = this
		return new Promise((res, rej)=>{
			const request = indexedDB.open("dirvdb", 4);
			request.onsuccess = function(event) {
			    const db = event.target.result;
			    const transaction = db.transaction(["dirvs"], "readonly");
			    const objectStore = transaction.objectStore("dirvs");
			    const getterRequest = objectStore.get(key);
			    
			    getterRequest.onsuccess = async function(event) {
			        const dirHandle = event.target.result
			        if (!dirHandle) return rej(`no "${key}" handler was found`)
			        await dirHandle.requestPermission()
			        res(new SelfConstructor(dirHandle))
			    };
			    
			    // Event handler for error during retrieval
			    getterRequest.onerror = function(event) {
			        console.error("Error retrieving data:", event.target.error)
			        rej(event.target.error)
			    };
			};

			// Event handler for error during opening of the database
			request.onerror = function(event) {
			    console.error("Error opening database:", event.target.error);
			    rej(event.target.error)
			};
			// Event handler for database version change (initial creation or upgrade)
			request.onupgradeneeded = function (event) {
			    const db = event.target.result;
				if (!db.objectStoreNames.contains("dirvs")) {
				    db.createObjectStore("dirvs");
				}
			}

		})
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
	// returns true if has the file, false if not. 
	async has(fileName) {
		try {
			await this.dir.getFileHandle(fileName)
			return true
		} catch (err) {
			if (err.name === "NotFoundError") return false
			console.error(err)
		}
	}
	// returns true if has the directory, false if not
	async hasDir(dirName) {
		try {
			await this.dir.getDirectoryHandle(dirName)
			return true
		} catch (err) {
			if (err.name === "NotFoundError") return false
			console.log(err.name)
			console.error(err)
		}
	}
	async delete(fileName) {
		const fileHandle = await this.take(fileName)
		return await fileHandle.remove()
	}
	// _cd returning Dirv instead of dir handle
	async cd(dirName, create = false) {
		return new Dirv(await this._cd(dirName, create))
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
	// create a directory and return its Dirv. trhows if directory exists.
	async mkdir(dirName) {
		if (await this.hasDir(dirName)) {
			throw new Error(`directory ${dirName} already exists`)
		}
		return await this.cd(dirName, true)
	} 
	// same with _ls but returns names
	async ls(kind = null) {
		return (await this._ls(kind)).map(handle=>handle.name)
	}
	async lsBoth() {
		const handles = await this._ls()
		const fileNames = []
		const dirNames = []
		for (const handle of handles) {
			if (handle.kind	== "file") fileNames.push(handle.name)
			if (handle.kind	== "directory") dirNames.push(handle.name)
		}
		return [fileNames, dirNames]
	}

	/* ---- methods using path ---- */
	// returns path dirv and last part's (file or folder) name string tuple.
	// can create the full path of its last directory.
	async dirOf(fullPath, create = false) {
		const pathArray = fullPath.split('/')
		const name = pathArray.pop()
		let current = this
		for (const dirName of pathArray)
			current = await current.cd(dirName, create)
		return [current, name]
	}
	// cd by full path to directory. can create the full path to directory.
	async goto(dirFullPath, create = false) {
		const [dirPath, dirName] = await this.dirOf(dirFullPath, create)
		return await dirPath.cd(dirName, create)
	}
	// returns file handle for given file path. can create the file's full path.
	// or .grab()
	async reach(fileFullPath, create = false) {
		const [filePath, fileName] = await this.dirOf(fileFullPath, create)
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
	async d(fileFullPath) {
		const [filePath, fileName] = await this.dirOf(fileFullPath)
		const fileHandle = await this.take(fileName)
		return await fileHandle.remove()
	}
	// enables us to deconstruct from an object a dirv that we cd into
	// const { childDir } = await dirv.dirs()
	// const childDir = await dirv.cd("childDir") // no duplicate needed
	async dirs() {
		const dirMap = {}
		const dirNames = await this.ls("directory")
		for (const dirName of dirNames) {
			dirMap[dirName] = await this.cd(dirName)
		}
		return dirMap
	}
	// end with "/" for directory. "sub/name" file, "sub/name/" directory.
	async exists(fullPath) {
		const [path, name] = await this.dirOf(fullPath)
		if (name.at(-1) == "/")
			return await this.hasDir(name.split(0, -1))
		return await this.has(name)
	}
	// copy the content of filePath1 to filePath2
	async copyFile(filePath1, filePath2) {
		return await this.w(filePath2, await this.r(filePath1))
	}
	// move file at filePath1 to filePath2
	async moveFile(filePath1, filePath2) {
		await this.copyFile(filePath1, filePath2)
		return await this.delete()
	}
	// copy the content of filePath1 to filePath2
	async copyInside(dirPath1, dirPath2, recursive = false) {
		const dir1 = await this.goto(dirPath1)
		const dir2 = await this.goto(dirPath2, true)
		const [fileNames, dirNames] = await dir1.lsBoth()
		for (const fileName of fileNames) {
			await dir2.write(fileName, await dir1.read(fileName))
		}
		if (recursive) {
			for (const dirName of dirNames) {
				await this.copyInside(`${dirPath1}/${dirName}`, `${dirPath2}/${dirName}`, true)
			}
		}
		return fileNames
	}
	// can take a while. clear method is called for every sub dirv recursively.
	async clear(recursive = false) {
		const [fileNames, dirNames] = await this.lsBoth()
		for (const fileName of fileNames) {
			await this.delete(fileName)
		}
		if (recursive) {
			for (const dirName of dirNames) {
				const subDir = await this.cd(dirName)
				subDir.clear(true)
			}
		}
	}
	// reads file. if don't exist, write provided content and return to it.
	async either(fileFullPath, content = "") {
		const [dirPath, fileName] = await this.dirOf(fileFullPath, true)
		if (await dirPath.has(fileName)) return await dirPath.read(fileName)
		await dirPath.write(fileName, content)
		return content
	}
}
