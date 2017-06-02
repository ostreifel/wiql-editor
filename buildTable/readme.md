Code for generating and slr parse table using an input ebnf

### Usage

```
npm install
cd ..\extension
grunt generate-table
```

### Updating the table
- Update productions in ..\extension\wiql.ebnf
- Add any new token or symbol tree symbols to ..\extension\scripts\wiqlEditor\compiler\symbols.ts
- Add patterns for any new token symbols to ..\extension\scripts\wiqlEditor\compiler\tokenPatterns.ts
