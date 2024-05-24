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

- `async saveSession(key = this.defaultKey)`  
save dir handle to load in the later sessions


- `async take(fileName, create = false)`  
returns file handle


- `async _cd(dirName, create = false)`  
returns sub directory handle


- `async _ls(kind = null)`  
pass `"file"` or `"directory"` to filter handles


- `async has(fileName)`  
returns `true` if has the file, `false` if not. 


- `async hasDir(dirName)`  
returns `true` if has the directory, `false` if not


- `async cd(dirName, create = false)`  
`_cd` returning a Dirv instead of dir handle


- `async read(fileName, create)`  
simplest way to read a top level file


- `async write(fileName, content = '')`  
simplest way to write to a top level file


- `async mkdir(dirName)`  
create a directory and return its Dirv. trhows if directory exists.


- `async ls(kind = null)`  
same with `_ls` but returns names


- `async dirOf(fullPath, create = false)`  
returns path Dirv and last part's (file or folder) name string tuple


- `async goto(dirFullPath, create = false)`  
cd by full path to directory.


- `async reach(fileFullPath, create = false)`  
returns file handle for given file path


- `async r(fileFullPath, create)`  
read a file by its path and return text string


- `async w(fileFullPath, contents = '', createPath = false)`  
write to a file by its path


- `async dirs(create = false)`  
enables us to deconstruct Dirv that we cd in by its name. 
`const { childDir } = await dirv.dirs ` is same with 
`const childDir = await dirv.cd("childDir")` // no duplicate "ChildDir" needed 


- `async exists(fullPath)`  
returns `true` or `false` if the given file or directory exists or not. 
end with "/" for directory. "sub/name" file, "sub/name/" directory.


- `async copyFile(filePath1, filePath2)`  
copy the content of filePath1 to filePath2


- `async moveFile(filePath1, filePath2)`  
move file at filePath1 to filePath2


- `async copyInside(dirPath1, dirPath2, recursive = false)`  
copy the content of filePath1 to filePath2


- `async clear(recursive = false)`  
can take a while. clear method is called for every sub dirv recursively.


- `async either(fileFullPath, content = "")`  
reads file. if don't exist, write provided content and return to it.

