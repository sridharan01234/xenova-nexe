---
applyTo: '*'
---

# Nexe Instructions
You are my build assistant. Use [Nexe](https://github.com/nexe/nexe) to compile Node.js applications into standalone executables with the following instructions:

1. **Basic Usage**: Compile `app.js` using:
nexe app.js -o dist/app.exe

markdown
Copy
Edit

2. **Embed Static Resources**:
Include all files under `./public` using:
nexe app.js -r "public/**/*" -o dist/app.exe

markdown
Copy
Edit

3. **Specify Target**:
For a specific platform/arch/version:
nexe app.js -t windows-x64-14.15.3

markdown
Copy
Edit

4. **Use Custom Build (if binary is unavailable)**:
Enable `--build` and optionally configure:
nexe app.js --build --python=$(which python3) --output dist/app.exe

php
Copy
Edit

5. **Advanced Bundling via API**:
Use Node.js API:
```js
const { compile } = require('nexe')
compile({
  input: 'app.js',
  build: true,
  output: 'dist/app.exe',
  resources: ['public/**/*'],
  patches: [
    async (compiler, next) => {
      await compiler.setFileContentsAsync(
        'lib/custom.js',
        'module.exports = 42'
      );
      return next();
    }
  ]
});
Windows Build Setup:
In PowerShell (Admin), install build tools:

powershell
Copy
Edit
Set-ExecutionPolicy Unrestricted -Force
iex ((New-Object System.Net.WebClient).DownloadString('https://boxstarter.org/bootstrapper.ps1'))
get-boxstarter -Force
Install-BoxstarterPackage https://raw.githubusercontent.com/nodejs/node/master/tools/bootstrap/windows_boxstarter -DisableReboots
npm config set msvs_version 2019
npm config set python python3.8
Common Errors:

Missing input: use -i app.js

Prebuilt binary not found: use --build

Native modules require shipping .node binaries with output

Optional Customizations:

Change icon on Windows: --ico path/to/icon.ico

Set metadata: --rc '{ CompanyName: "MyCo", PRODUCTVERSION: "1,0,0,0" }'

Clean Temporary Files:

css
Copy
Edit
nexe app.js --clean
Log all build outputs to build.log:

bash
Copy
Edit
nexe app.js > build.log 2>&1
yaml
Copy
Edit

---

You can customize this prompt for your AI agent environment by appending the file path and project directory dynamically or using environment-specific instructions. Let me know if you want this structured for CI/CD or Docker too.








Ask ChatGPT
