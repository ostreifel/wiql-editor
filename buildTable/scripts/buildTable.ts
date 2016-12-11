import * as fs from 'fs';

fs.readFile('wiql.ebnf', (error, data) => {
    console.log('data');
    console.log(data);
    console.log('error');
    console.log(error);
});
