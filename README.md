## Hive Scout Bee

The Hive Scout Bee package contains logic to recommend an approach for streaming query processing based on the characteristics of the data.

The package includes currently includes an extractor `SignatureExtractor`, which analyzes the data and provides insights into its structure and properties.

## Install

```bash
npm install hive-scout-bee
```

## Usage
```ts
import { SignatureExtractor } from './SignatureExtractor';

const extractor = new SignatureExtractor();
const windowData = new Set<Quad>([
    // ... populate with your data
]);
const signature = extractor.extractSignature(windowData);
```

## License

The code is copyrighted by [Ghent University - imec](https://www.ugent.be/ea/idlab/en) and released under the [MIT Licence](./LICENCE.md)

## Contact

For any questions, please contact [Kush](mailto:mailkushbisen@gmail.com) or create an issue in the repository. 