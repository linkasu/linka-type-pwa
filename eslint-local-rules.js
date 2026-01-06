module.exports = {
  rules: {
    'max-file-lines': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Enforce maximum number of lines per file',
          category: 'Best Practices',
        },
        schema: [
          {
            type: 'object',
            properties: {
              max: {
                type: 'number',
                default: 200,
              },
            },
            additionalProperties: false,
          },
        ],
      },
      create(context) {
        const options = context.options[0] || {}
        const maxLines = options.max || 200

        return {
          Program(node) {
            const sourceCode = context.getSourceCode()
            const lines = sourceCode.lines.length

            if (lines > maxLines) {
              context.report({
                node,
                message: `File has ${lines} lines, maximum allowed is ${maxLines}. Consider splitting into smaller modules.`,
              })
            }
          },
        }
      },
    },
  },
}

