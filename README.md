# Dirv
### basic usage
```js
import { Dirv } from "./dirv.js"
const dirv = await Dirv.pick() // open system's directory picker
await dirv.write("hello.txt", "this is our message")
const inner = await dirv.cd("inner") // take an inner folder
await inner.write("nested.json", '{ "bird": true }')
```

### don't make user pick every time
```js
continueButton.onclick = async () => {
	let dirv
	try {
		dirv = await Dirv.want()
	} catch (err){
		if (confirm("previous Dirv was not found. pick new one")) {
			dirv = await Dirv.pick()
			dirv.saveSession() // next time .want() will load this
		}
	}
}
```
> you can pass `key` to `.want()` and `.pick()` to differentiate which saved 
> Dirv to load.

here's a list of all instance methods (keep in mind, all are async).  
more info in the source code :p

- `pick(opts = { mode: 'readwrite' })`
- `saveSession(key = this.defaultKey)`
- `want(key = this.defaultKey)`
- `function(event)`
- `take(fileName, create = false)`
- `_cd(dirName, create = false)`
- `_ls(kind = null)`
- `has(fileName)`
- `hasDir(dirName)`
- `delete(fileName)`
- `cd(dirName, create = false)`
- `read(fileName, create)`
- `write(fileName, content = '')`
- `mkdir(dirName)`
- `ls(kind = null)`
- `lsBoth()`
- `dirOf(fullPath, create = false)`
- `goto(dirFullPath, create = false)`
- `reach(fileFullPath, create = false)`
- `r(fileFullPath, create)`
- `w(fileFullPath, contents = '', createPath = false)`
- `d(fileFullPath)`
- `dirs(create = false)`
- `exists(fullPath)`
- `copyFile(filePath1, filePath2)`
- `moveFile(filePath1, filePath2)`
- `copyInside(dirPath1, dirPath2, recursive = false)`
- `clear(recursive = false)`
- `either(fileFullPath, content = "")`