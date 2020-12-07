module.exports = {
	'env': {
		'es6': true,
		'node': true,
		"jest/globals": true,
	},
	"parser": "@typescript-eslint/parser",
	'extends': ['eslint:recommended'],
	'globals': {
		// When linting job scripts
		'biniou': 'readonly',
	},
	'parserOptions': {
		'ecmaVersion': 2018,
		"ecmaFeatures": {
			"jsx": true,
	    },
	    "sourceType": "module",
	},
	'rules': {
		// -------------------------------
		// Code correctness
		// -------------------------------
		// This is handled by TypeScript:
		"no-unused-vars": 0,
		"no-constant-condition": 0,
		"no-prototype-builtins": 0,
		// This error is always a false positive so far since it detects
		// possible race conditions in contexts where we know it cannot happen.
		"require-atomic-updates": 0,
		// "no-lonely-if": "error",

		// -------------------------------
		// Formatting
		// -------------------------------
		"space-in-parens": ["error", "never"],
		"semi": ["error", "always"],
		"eol-last": ["error", "always"],
		"quotes": ["error", "single"],
		"indent": ["error", "tab"],
		"comma-dangle": ["error", "always-multiline"],
		"no-trailing-spaces": "error",
		"linebreak-style": ["error", "unix"],
		"prefer-template": ["error"],
		"template-curly-spacing": ["error", "never"],
		"key-spacing": ["error", {
			"beforeColon": false,
			"afterColon": true,
			"mode": "strict"
		}],
		"block-spacing": ["error"],
		"brace-style": ["error", "1tbs", { "allowSingleLine": true }],
		"no-spaced-func": ["error"],
		"func-call-spacing": ["error"],
		"space-before-function-paren": ["error", {
			"anonymous": "never",
			"named": "never",
			"asyncArrow": "always"
		}],
		"multiline-comment-style": ["error", "separate-lines"],
		"space-before-blocks": "error",
		"spaced-comment": ["error", "always"],
		"keyword-spacing": ["error", { "before": true, "after": true }]
	},
	"plugins": [
		"@typescript-eslint",
		"jest",
	],
};