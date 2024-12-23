import SuffixTree from "./suffixtree.js";

class TestManager {
    constructor(fs) {
        this.fs = fs;
        this.passed = 0;
        this.failed = 0;
        this.results = [];
        this.dirNames = ['documents', 'photos', 'music', 'downloads', 'projects', 'backup', 'work', 'personal', 'videos', 'games'];
        this.fileNames = [
            'report.txt', 'image.jpg', 'data.csv', 'notes.md', 'script.js',
            'config.json', 'index.html', 'style.css', 'readme.txt', 'log.txt',
            'document.pdf', 'presentation.ppt', 'budget.xlsx', 'todo.txt', 'backup.zip',
            'profile.jpg', 'main.js', 'test.py', 'settings.xml', 'draft.doc',
            'music.mp3', 'video.mp4', 'archive.rar', 'schema.sql', 'template.html',
            'report2.docx', 'image2.png', 'data2.json', 'notes2.txt', 'script2.php',
            'config2.yml', 'index2.htm', 'style2.scss', 'readme2.md', 'log2.log',
            'doc3.pdf', 'slide.key', 'sheet.csv', 'list.txt', 'package.zip',
            'avatar.png', 'util.js', 'test2.rb', 'meta.xml', 'draft2.txt'
        ];
        this.possibleContents = [
            'This is a sample text document.',
            'Important meeting notes from last week.',
            'Project requirements and specifications.',
            'Dear John, Thank you for your email...',
            'TODO: 1. Complete report 2. Send emails',
            'Markdown Header\n* Bullet point\n* Another point',
            '{"name": "Test", "value": 123}',
            'console.log("Hello World!");',
            '<html><body>Sample webpage</body></html>',
            'SELECT * FROM users WHERE active = true;',
            '2024 Budget Planning Document',
            'Recipe: 1. Mix ingredients 2. Bake at 350F',
            'Weekly Status Report - In Progress',
            'Shopping list: milk, bread, eggs',
            'Contact: John Doe (555) 123-4567'
        ];
    }
    runAllTests() {
        // Directory operations
        const initialDir = this.fs.getAbsolutePath();
        this.fs.mkdir('/testDir');

        this.test('cd changes directory', () => {
            this.fs.cd('/');
            if (this.fs.getAbsolutePath() !== '/') throw new Error('Directory not changed');
            this.fs.cd('testDir')
        });
        this.test('mkdir creates directory', () => {
            this.fs.mkdir('/testDir');
            const dirs = this.fs.ls('/');
            if (!dirs.includes('testDir/')) throw new Error('Directory not created');
        });
        this.test('cd changes directory', () => {
            this.fs.cd('/testDir');
            if (this.fs.getAbsolutePath() !== '/testDir') throw new Error('Directory not changed');
        });

        this.test('rmdir removes directory', () => {
            this.fs.cd('/');
            this.fs.rmdir('/testDir');
            const dirs = this.fs.ls('/');
            if (dirs.includes('testDir/')) throw new Error('Directory not removed');
        });
        // File operations
        this.test('touch creates file', () => {
            this.fs.writeFile('/test.txt', '');
            const files = this.fs.ls('/');
            if (!files.includes('test.txt')) throw new Error('File not created');
        });

        this.test('echo writes to file', () => {
            const content = 'test content';
            this.fs.writeFile('/test.txt', content);
            const readContent = this.fs.readFile('/test.txt');
            if (readContent !== content) throw new Error('Content not written correctly');
        });

        this.test('cat reads file', () => {
            const content = 'test content';
            const readContent = this.fs.readFile('/test.txt');
            if (readContent !== content) throw new Error('Content not read correctly');
        });

        this.test('rm removes file', () => {
            this.fs.rm('/test.txt');
            const files = this.fs.ls('/');
            if (files.includes('test.txt')) throw new Error('File not removed');
        });

        // Path resolution
        this.test('absolute path resolution', () => {
            this.fs.mkdir('/a/b/c');
            const path = this.fs.resolvePath('/a/b/c');
            if (!path.isDirectory) throw new Error('Path resolution failed');
        });

        this.test('relative path resolution', () => {
            this.fs.cd('/a');
            const path = this.fs.resolvePath('b/c');
            if (!path.isDirectory) throw new Error('Relative path resolution failed');
        });

        // Error cases
        this.test('error on invalid path', () => {
            try {
                this.fs.resolvePath('/nonexistent');
                throw new Error('Should have thrown error');
            } catch (e) {
                if (!e.message.includes('Path not found')) throw new Error('Wrong error message');
            }
        });

        // Hard-coded test
        this.test('hard test', () => {
            this.fs.cd('/');
            //console.log(this.fs.ls('.'))
            this.fs.mkdir('testDir');
            this.fs.cd('testDir');
            const fileMap = new Map();
            const dirMap = new Map();
            const was = new Map();
            // Create random number of directories (1-5)
            const numDirs = Math.floor(Math.random() * 5) + 1;
            for (let i = 0; i < numDirs; i++) {
                const dirName = this.dirNames[Math.floor(Math.random() * this.dirNames.length)];
                this.fs.mkdir(dirName);
                this.fs.cd(dirName);

                const dirPath = this.fs.getAbsolutePath();
                const childFiles = [];

                // Create random number of files (1-3) in each directory
                const numFiles = Math.floor(Math.random() * 3) + 1;
                for (let j = 0; j < numFiles; j++) {
                    const fileName = this.fileNames[Math.floor(Math.random() * this.fileNames.length)];
                    const content = this.possibleContents[Math.floor(Math.random() * this.possibleContents.length)];
                    this.fs.writeFile(fileName, content);
                    // Remember file information
                    fileMap.set(fileName, {
                        name: fileName,
                        path: dirPath + '/' + fileName,
                        content: content
                    });
                    childFiles.push(fileName);
                }
                // Remember directory information
                dirMap.set(dirName, {
                    name: dirName,
                    path: dirPath,
                    children: childFiles
                });
                // Verify directory and file information matches filesystem
                // Check directory exists and has correct files
                const dirContents = this.fs.ls('.');
                const expectedFiles = dirMap.get(dirName).children;
                for (const file of expectedFiles) {
                    if (!dirContents.includes(file)) {
                        throw new Error(`File ${file} not found in directory ${dirName}`);
                    }
                    // Verify file content matches
                    const actualContent = this.fs.readFile(file);
                    const expectedContent = fileMap.get(file).content;
                    if (actualContent !== expectedContent) {
                        throw new Error(`Content mismatch in ${file}`);
                    }
                }
            }
            this.fs.cd('..');
            if (fileMap.size === 0 || dirMap.size === 0) {
                throw new Error('Maps not populated correctly');
            }
        });
        this.fs.rmrf('/testDir');
        this.test('Suffix tree test', () => {
            const tree = new SuffixTree();
            this.fs.cd('/');
            this.fs.mkdir('testDir');
            this.fs.cd('testDir');
            const fileMap = new Map();
            const dirMap = new Map();
            
            // Create random number of directories (1-5)
            const numDirs = Math.floor(Math.random() * 10) + 1;
            for (let i = 0; i < numDirs; i++) {
                const dirName = this.dirNames[Math.floor(Math.random() * this.dirNames.length)];
                this.fs.mkdir(dirName);
                this.fs.cd(dirName);

                const dirPath = this.fs.getAbsolutePath();
                const childFiles = [];

                // Create random number of files (1-3) in each directory
                const numFiles = Math.floor(Math.random() * 20) + 1;
                for (let j = 0; j < numFiles; j++) {
                    const fileName = this.fileNames[Math.floor(Math.random() * this.fileNames.length)];
                    const content = this.possibleContents[Math.floor(Math.random() * this.possibleContents.length)];
                    tree.addString(content);
                    this.fs.writeFile(fileName, content);

                    fileMap.set(fileName, {
                        name: fileName,
                        path: dirPath + '/' + fileName,
                        content: content
                    });
                    childFiles.push(fileName);
                }
                for (let file of fileMap.values()) {
                    const startIdx = Math.floor(Math.random() * file.content.length);
                    const maxLength = file.content.length - startIdx; // Remaining length of the string
                    const length = Math.floor(Math.random() * maxLength) + 1; // Random substring length
                    const randomSubstring = file.content;

                    const searchResult = tree.search(randomSubstring);
                    if (searchResult.findIndex((result) => result === randomSubstring) === -1) {
                        throw new Error(`SuffixTree search failed for substring: ${randomSubstring}`);
                    }
                }  
                dirMap.set(dirName, {
                    name: dirName,
                    path: dirPath,
                    children: childFiles
                });
            }
            this.fs.cd('..');
            if (fileMap.size === 0 || dirMap.size === 0) {
                throw new Error('Maps not populated correctly');
            }
        });


        this.test('initialize and clear SuffixTree', () => {
            const tree = new SuffixTree();
            if (tree.text !== '') throw new Error('initial `text` is not empty');
            if (tree.words.length !== 0) throw new Error('initial `words` is not empty');
            if (tree.k !== 0) throw new Error('initial value of `k` is not 0');
            if (tree.i !== -1) throw new Error('initial value of `i` is not -1');

            tree.addString('example');
            tree.clear();

            if (tree.text !== '') throw new Error('`text` should be empty after clear');
            if (tree.words.length !== 0) throw new Error('`words` should be empty after clear');
            if (tree.k !== 0) throw new Error('`k` should be reset to 0 after clear');
            if (tree.i !== -1) throw new Error('`i` should be reset to -1 after clear');
        });

        this.test('add string to SuffixTree', () => {
            const tree = new SuffixTree();
            tree.addString('banana');
            if (!tree.text.includes('banana')) throw new Error('Text not added correctly');
            if (!tree.words.includes('banana#0#')) throw new Error('Word not added correctly');
        });

        this.test('search for patterns in SuffixTree', () => {
            const tree = new SuffixTree();
            tree.addString('banana');
            tree.addString('band');

            let result = tree.search('ban');
            if (!result.includes('banana') || !result.includes('band')) throw new Error('pattern search failed for "ban"');

            result = tree.search('ana');
            if (!result.includes('banana')) throw new Error('pattern search failed for "ana"');

            result = tree.search('band');
            if (!result.includes('band')) throw new Error('pattern search failed for "band"');

            result = tree.search('not_in_tree');
            if (result.length !== 0) throw new Error('pattern search should have failed for nonexistent pattern');
        });

        this.test('find overlapping patterns in SuffixTree', () => {
            const tree = new SuffixTree();
            tree.addString('ananabana');

            const result = tree.search('ana');
            if (!result.includes('ananabana')) throw new Error('pattern search failed for overlapping "ana"');
        });

        this.fs.rmrf('/testDir');
        this.fs.cd(initialDir);
        return this.formatResults();
    }

    test(testName, fn) {
        try {
            fn();
            this.passed++;
            this.results.push(`✓ ${testName}`);
        } catch (error) {
            this.failed++;
            this.results.push(`✗ ${testName}: ${error.message}`);
        }
    }
    formatResults() {
        return [
            'Test Results:',
            '=============',
            '',
            ...this.results,
            '',
            `Total: ${this.passed + this.failed}`,
            `Passed: ${this.passed}`,
            `Failed: ${this.failed}`,
            '',
            this.failed === 0 ? 'All tests passed!' : 'Some tests failed.'
        ].join('\n');

    }
}

export default TestManager;