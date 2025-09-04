## Hive Scout Bee

The Hive Scout Bee package provides an adaptive approach selection system for RDF stream processing. It analyzes data characteristics and automatically recommends the most appropriate processing approach based on configurable thresholds.

The package includes:
- **SignatureExtractor**: Analyzes RDF data and extracts statistical features (variance, skewness, entropy, FFT entropy)
- **HiveScoutBee**: Adaptive approach selection engine that matches data characteristics to optimal processing strategies

## Install

```bash
npm install hive-scout-bee
```

## Usage

### Basic Signature Extraction
```ts
import { SignatureExtractor } from 'hive-scout-bee';
import { DataFactory } from 'n3';

const { quad, namedNode, literal } = DataFactory;

const extractor = new SignatureExtractor();
const windowData = new Set([
    quad(
        namedNode('http://example.org/sensor1'),
        namedNode('http://example.org/hasValue'),
        literal('42.5', namedNode('http://www.w3.org/2001/XMLSchema#double'))
    ),
    // ... add more quads
]);

const signature = extractor.extractSignature(windowData);
console.log(signature);
// Output: { tripleCount: 1, variance: 0, skewness: 0, entropy: 0, fftEntropy: 0 }
```

### Adaptive Approach Selection
```ts
import { HiveScoutBee, ApproachConfig } from 'hive-scout-bee';

// Configure different processing approaches
const approaches: ApproachConfig[] = [
    {
        name: 'approach1',
        minThresholds: { tripleCount: 100 },
        maxThresholds: { variance: 1.0, entropy: 2.0 },
        priority: 5
    },
    {
        name: 'approach2',
        minThresholds: { variance: 2.0, entropy: 3.0 },
        maxThresholds: { tripleCount: 500 },
        priority: 8
    },
    {
        name: 'approach3',
        minThresholds: { tripleCount: 1000 },
        priority: 3
    }
];

// Initialize the adaptive system
const hiveScout = new HiveScoutBee(approaches);

// Analyze data and get recommendation
const recommendation = hiveScout.chooseApproach(windowData);

console.log(recommendation);
// Output: {
//   recommendedApproach: 'approach1',
//   matchingApproaches: ['approach1', 'approach3'],
//   signature: { tripleCount: 150, variance: 0.8, entropy: 1.5, ... },
//   confidence: 0.95
// }
```

### Dynamic Approach Management
```ts
// Add new approaches at runtime
hiveScout.addApproach({
    name: 'approach4',
    maxThresholds: { tripleCount: 50, variance: 0.5 },
    priority: 10
});

// Remove approaches
hiveScout.removeApproach('approach3');

// Get available approaches
const available = hiveScout.getAvailableApproaches();
console.log(available); // ['approach1', 'approach2', 'approach4']
```



## License

The code is copyrighted by [Ghent University - imec](https://www.ugent.be/ea/idlab/en) and released under the [MIT Licence](./LICENCE.md)

## Contact

For any questions, please contact [Kush](mailto:mailkushbisen@gmail.com) or create an issue in the repository. 