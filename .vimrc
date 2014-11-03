let $PATH = './node_modules/.bin:' . $PATH
let g:syntastic_javascript_checkers = ['eslint']
autocmd BufNewFile,BufEnter .eslintrc setlocal filetype=yaml
