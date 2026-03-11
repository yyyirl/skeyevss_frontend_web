// export default {
module.exports = {
	env: {
		browser: false,
		es2021: true,
	},
	extends: [
		'standard-with-typescript',
		// '@typescript-eslint/recommended',
		'plugin:react/recommended',
		'eslint:recommended'
		// 'plugin:prettier/recommended'
	],
	overrides: [
		{
			env: {
				node: true,
			},
			files: [
				'.eslintrc.{js,cjs}',
			],
		},
	],
	plugins: [
		'react',
		'@typescript-eslint',
		// 'prettier',
	],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: './tsconfig.json',
		tsconfigRootDir: __dirname,
	},
	rules: {
		'@typescript-eslint/consistent-indexed-object-style': [ 'error', 'index-signature' ], // 指定在 TypeScript 中使用索引对象时的一致性
		eqeqeq: [ 2, 'always' ], // 要求使用 === 和 !==
		semi: [ 2, 'never' ], // 要求或禁止使用分号代替 ASI
		quotes: [ 2, 'single' ],  // 强制使用一致的反勾号、双引号或单引号

		// '@typescript-eslint/indent': [ 2, 4, { 'SwitchCase': 1 } ],
		// '@typescript-eslint/indent': ['error', 'tab', { SwitchCase: 1 }],
		// 'indent': ['error', 'tab'],
		// 'no-tabs': 'off',

		'@typescript-eslint/indent': ['error', 'tab', {
			ignoredNodes: [
				'SwitchCase',
				'SwitchStatement'
			],
			SwitchCase: 0
		}],
		'indent': ['error', 'tab', {
			ignoredNodes: ['SwitchCase', 'SwitchStatement'],
			SwitchCase: 0
		}],
		'no-tabs': 'off',

		// 'prettier/prettier': ['error'],
		// "eol-last": ["error", "never"], // 文件末尾空格
		'eol-last': 0,
		'no-multiple-empty-lines': [
			'error', { 'max': 1, 'maxEOF': 0 },
		],
		'@typescript-eslint/consistent-type-imports': 'error',
		'object-curly-spacing': [ 'error', 'always' ],
		'array-bracket-spacing': [ 2, 'always' ],
		'@typescript-eslint/space-before-function-paren': [ 'error', 'never' ],
		'computed-property-spacing': [ 'error', 'always' ],
		'template-curly-spacing': [ 'error', 'always' ],
		'multiline-ternary': [ 'warn', 'always-multiline' ],
		'space-before-function-paren': 0,
		'@typescript-eslint/no-var-requires': 0,
	},
}
