// terminal.js
import SuffixTree from './suffixtree.js';

class Terminal {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            prompt: options.prompt || '> ',
            welcomeMessage: options.welcomeMessage || 'Welcome to WebTerminal\nType "help" for available commands.',
            theme: options.theme || {
                background: '#1e1e1e',
                text: '#ffffff',
                prompt: '#00ff00',
                command: '#ffffff',
                output: '#cccccc',
                search: '#ff6b6b'
            }
        };

        this.currentPrompt = this.options.initialPrompt;
        this.history = [];
        this.historyIndex = -1;
        this.commands = {};
        this.suffixtree = new SuffixTree();

        // Reverse search state
        this.isSearching = false;
        this.searchBuffer = '';
        this.searchResults = [];
        this.searchResultIndex = -1;

        // Autocomplete state
        this.autocompleteSuggestions = [];
        this.autocompleteIndex = -1;
        this.lastTabInput = '';

        this.initializeTerminal();
    }

    getCommandSuggestions(prefix) {
        return Object.keys(this.commands)
            .filter(cmd => cmd.startsWith(prefix.toLowerCase()))
            .sort();
    }

    handleAutocomplete() {
        const input = this.currentInput.value;
        const words = input.split(/\s+/);
        const currentWord = words[0];

        // Only autocomplete if we're working with the first word (command name)
        if (words.length === 1) {
            // If this is a new tab press with different input, generate new suggestions
            if (currentWord !== this.lastTabInput) {
                this.autocompleteSuggestions = this.getCommandSuggestions(currentWord);
                this.autocompleteIndex = -1;
                this.lastTabInput = currentWord;

                // Show all suggestions only on first Tab press
                if (this.autocompleteSuggestions.length > 1) {
                    const suggestionsText = this.autocompleteSuggestions
                        .map(s => `${s}${this.commands[s].description ? ` - ${this.commands[s].description}` : ''}`)
                        .join('\n');
                    this.output(suggestionsText);
                }
            }

            if (this.autocompleteSuggestions.length > 0) {
                // Cycle through suggestions
                this.autocompleteIndex = (this.autocompleteIndex + 1) % this.autocompleteSuggestions.length;
                const suggestion = this.autocompleteSuggestions[this.autocompleteIndex];

                // Update input with the suggestion
                this.currentInput.value = suggestion;
                this.currentInput.focus();
            }
        }
    }


    initializeTerminal() {
        // Create terminal container
        this.terminalElement = document.createElement('div');
        this.terminalElement.className = 'terminal';
        this.container.appendChild(this.terminalElement);

        // Apply basic styles
        Object.assign(this.terminalElement.style, {
            backgroundColor: this.options.theme.background,
            color: this.options.theme.text,
            padding: '20px',
            fontFamily: 'monospace',
            height: '100%',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap'
        });

        // Welcome message
        this.output(this.options.welcomeMessage);
        this.createNewPrompt();

        // Event listeners
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        this.terminalElement.addEventListener('click', () => {
            if (this.currentInput) {
                this.currentInput.focus();
            }
        });
    }

    createNewPrompt(prefill = '') {
        const line = document.createElement('div');
        line.className = 'terminal-line';

        const prompt = document.createElement('span');
        prompt.className = 'prompt';
        prompt.textContent = this.isSearching ?
            '(reverse-i-search)`' + this.searchBuffer + '`: ' :
            this.options.prompt;
        prompt.style.color = this.isSearching ?
            this.options.theme.search :
            this.options.theme.prompt;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'terminal-input';
        input.value = prefill;
        Object.assign(input.style, {
            backgroundColor: 'transparent',
            border: 'none',
            color: this.options.theme.command,
            fontFamily: 'monospace',
            fontSize: 'inherit',
            outline: 'none',
            width: 'calc(100% - 20px)'
        });

        line.appendChild(prompt);
        line.appendChild(input);
        this.terminalElement.appendChild(line);

        this.currentInput = input;
        this.currentPrompt = prompt;
        this.currentInput.focus();
    }

    startSearch() {
        this.isSearching = true;
        this.searchBuffer = '';
        this.searchResults = [];
        this.searchResultIndex = -1;
        this.updatePrompt();
    }

    endSearch() {
        this.isSearching = false;
        this.searchBuffer = '';
        this.searchResults = [];
        this.searchResultIndex = -1;
        this.updatePrompt();
    }

    updatePrompt() {
        if (this.currentPrompt) {
            this.currentPrompt.textContent = this.isSearching ?
                '(reverse-i-search)`' + this.searchBuffer + '`: ' :
                this.options.prompt;
            this.currentPrompt.style.color = this.isSearching ?
                this.options.theme.search :
                this.options.theme.prompt;
        }
    }

    searchHistory(forward = false) {
        if (this.searchBuffer.length === 0) {
            this.searchResults = [];
            this.searchResultIndex = -1;
            this.currentInput.value = '';
            return;
        }

        // Use suffix tree to search
        this.searchResults = this.suffixtree.search(this.searchBuffer);

        if (this.searchResults.length > 0) {
            if (forward) {
                this.searchResultIndex = (this.searchResultIndex + 1) % this.searchResults.length;
            } else {
                this.searchResultIndex = this.searchResultIndex <= 0 ?
                    this.searchResults.length - 1 :
                    this.searchResultIndex - 1;
            }
            this.currentInput.value = this.searchResults[this.searchResultIndex];
        } else {
            this.searchResultIndex = -1;
            this.currentInput.value = '';
        }
    }

    handleKeyPress(event) {
        if (!this.currentInput) return;

        if (event.key === 'Tab') {
            event.preventDefault();
            this.handleAutocomplete();
            return;
        }

        if (event.key !== 'Tab' && event.key !== 'Shift') {
            this.autocompleteSuggestions = [];
            this.autocompleteIndex = -1;
            this.lastTabInput = '';
        }

        // Handle Ctrl+R to start reverse search
        if (event.ctrlKey && event.key === 'r') {
            event.preventDefault();
            if (!this.isSearching) {
                this.startSearch();
            } else {
                this.searchHistory(true);
            }
            return;
        }

        // Handle ESC to end search
        if (event.key === 'Escape' && this.isSearching) {
            event.preventDefault();
            this.endSearch();
            return;
        }

        if (this.isSearching) {
            if (event.key === 'Backspace') {
                event.preventDefault();
                this.searchBuffer = this.searchBuffer.slice(0, -1);
                this.updatePrompt();
                this.searchHistory();
            } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
                event.preventDefault();
                this.searchBuffer += event.key;
                this.updatePrompt();
                this.searchHistory();
            }
            return;
        }

        switch(event.key) {
            case 'Enter':
                event.preventDefault();
                const command = this.currentInput.value;
                if (command.trim()) {
                    this.history.push(command);
                    this.historyIndex = this.history.length;
                    // Add command to suffix tree
                    this.suffixtree.addString(command);
                    this.executeCommand(command);
                }
                break;

            case 'ArrowUp':
                event.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    this.currentInput.value = this.history[this.historyIndex];
                }
                break;

            case 'ArrowDown':
                event.preventDefault();
                if (this.historyIndex < this.history.length - 1) {
                    this.historyIndex++;
                    this.currentInput.value = this.history[this.historyIndex];
                } else {
                    this.historyIndex = this.history.length;
                    this.currentInput.value = '';
                }
                break;
        }
    }

    async executeCommand(commandString) {
        const args = commandString.trim().split(/\s+/);
        const commandName = args[0].toLowerCase();
        const commandArgs = args.slice(1);

        this.currentInput.disabled = true;

        if (this.commands[commandName]) {
            try {
                const output = await this.commands[commandName].execute(commandArgs);
                if (output) {
                    this.output(output);
                }
            } catch (error) {
                this.output(`Error: ${error.message}`);
            }
        } else {
            this.output(`Command not found: ${commandName}`);
        }

        this.createNewPrompt();
    }

    output(text) {
        const output = document.createElement('div');
        output.className = 'terminal-output';
        output.textContent = text;
        output.style.color = this.options.theme.output;
        this.terminalElement.appendChild(output);
        this.terminalElement.scrollTop = this.terminalElement.scrollHeight;
    }

    registerCommand(name, description, execute) {
        this.commands[name.toLowerCase()] = { description, execute };
    }

    clear() {
        while (this.terminalElement.firstChild) {
            this.terminalElement.removeChild(this.terminalElement.firstChild);
        }
        this.createNewPrompt();
    }
}

export default Terminal;