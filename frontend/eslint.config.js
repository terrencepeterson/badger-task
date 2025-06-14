import pluginVue from 'eslint-plugin-vue'
export default [
    ...pluginVue.configs['flat/recommended'],
    {
        rules: {
            "vue/html-indent": ["error", 4],
            "vue/first-attribute-linebreak": ["error", {
                "singleline": "ignore",
                "multiline": "ignore"
            }],
            "vue/max-attributes-per-line": ["error", {
                "singleline": {
                    "max": 3
                },
                "multiline": {
                    "max": 1
                }
            }]
        }
    }
]
