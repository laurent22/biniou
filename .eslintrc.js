module.exports = {
	'env': {
		'es6': true,
		'node': true,
		"jest/globals": true,
	},
	"parser": "@typescript-eslint/parser",
	'extends': ['eslint:recommended'],
	'globals': {
		'fetch': 'readonly',
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
	'overrides': [
		{
			// enable the rule specifically for TypeScript files
			'files': ['*.ts', '*.tsx'],
			'parserOptions': {
				// Required for @typescript-eslint/no-floating-promises
				'project': './tsconfig.json',
			},
			'rules': {
				// Warn only because it would make it difficult to convert JS classes to TypeScript, unless we
				// make everything public which is not great. New code however should specify member accessibility.
				'@typescript-eslint/explicit-member-accessibility': ['warn'],
				'@typescript-eslint/type-annotation-spacing': ['error', { 'before': false, 'after': true }],
				'@typescript-eslint/comma-dangle': ['error', {
					'arrays': 'always-multiline',
					'objects': 'always-multiline',
					'imports': 'always-multiline',
					'exports': 'always-multiline',
					'enums': 'always-multiline',
					'generics': 'always-multiline',
					'tuples': 'always-multiline',
					'functions': 'always-multiline',
				}],
				'@typescript-eslint/semi': ['error', 'always'],
				'@typescript-eslint/member-delimiter-style': ['error', {
					'multiline': {
						'delimiter': 'semi',
						'requireLast': true,
					},
					'singleline': {
						'delimiter': 'semi',
						'requireLast': false,
					},
				}],
				'@typescript-eslint/no-floating-promises': ['error'],
			},
		},
	],
};