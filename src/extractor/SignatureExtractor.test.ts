import { SignatureExtractor } from './SignatureExtractor';
import { DataFactory, Quad } from 'n3';

const { namedNode, literal, quad } = DataFactory;

describe('SignatureExtractor', () => {
    let extractor: SignatureExtractor;

    beforeEach(() => {
        extractor = new SignatureExtractor();
    });

    describe('extractSignature', () => {
        it('should handle empty dataset', () => {
            const windowData = new Set<Quad>();
            const result = extractor.extractSignature(windowData);

            expect(result).toEqual({
                tripleCount: 0,
                variance: 0,
                skewness: 0,
                entropy: 0,
                fftEntropy: 0
            });
        });

        it('should count triples correctly', () => {
            const windowData = new Set<Quad>([
                quad(
                    namedNode('http://example.org/subject1'),
                    namedNode('http://example.org/predicate1'),
                    literal('value1')
                ),
                quad(
                    namedNode('http://example.org/subject2'),
                    namedNode('http://example.org/predicate2'),
                    literal('value2')
                )
            ]);

            const result = extractor.extractSignature(windowData);
            expect(result.tripleCount).toBe(2);
        });

        it('should extract numeric values with explicit datatypes', () => {
            const windowData = new Set<Quad>([
                quad(
                    namedNode('http://example.org/subject1'),
                    namedNode('http://example.org/age'),
                    literal('25', namedNode('http://www.w3.org/2001/XMLSchema#integer'))
                ),
                quad(
                    namedNode('http://example.org/subject2'),
                    namedNode('http://example.org/height'),
                    literal('5.8', namedNode('http://www.w3.org/2001/XMLSchema#decimal'))
                ),
                quad(
                    namedNode('http://example.org/subject3'),
                    namedNode('http://example.org/weight'),
                    literal('70.5', namedNode('http://www.w3.org/2001/XMLSchema#double'))
                ),
                quad(
                    namedNode('http://example.org/subject4'),
                    namedNode('http://example.org/age'),
                    literal('30.345', namedNode('http://www.w3.org/2001/XMLSchema#float'))
                )
            ]);

            const result = extractor.extractSignature(windowData);

            expect(result.tripleCount).toBe(4);
            expect(result.variance).toBeGreaterThan(0);
            expect(result.entropy).toBeGreaterThan(0);
        });

        it('should extract numeric values without explicit datatypes', () => {
            const windowData = new Set<Quad>([
                quad(
                    namedNode('http://example.org/subject1'),
                    namedNode('http://example.org/score'),
                    literal('10')
                ),
                quad(
                    namedNode('http://example.org/subject2'),
                    namedNode('http://example.org/score'),
                    literal('20')
                ),
                quad(
                    namedNode('http://example.org/subject3'),
                    namedNode('http://example.org/score'),
                    literal('30')
                )
            ]);

            const result = extractor.extractSignature(windowData);
            
            expect(result.tripleCount).toBe(3);
            expect(result.variance).toBe(100); // variance of [10, 20, 30]
            expect(result.fftEntropy).toBeGreaterThan(0); // FFT entropy should be > 0 for varying data
        });

        it('should ignore non-numeric literals', () => {
            const windowData = new Set<Quad>([
                quad(
                    namedNode('http://example.org/subject1'),
                    namedNode('http://example.org/name'),
                    literal('John')
                ),
                quad(
                    namedNode('http://example.org/subject2'),
                    namedNode('http://example.org/age'),
                    literal('25', namedNode('http://www.w3.org/2001/XMLSchema#integer'))
                )
            ]);

            const result = extractor.extractSignature(windowData);
            
            expect(result.tripleCount).toBe(2);
            expect(result.variance).toBe(0); // only one numeric value
        });

        it('should calculate entropy based on predicate distribution', () => {
            const windowData = new Set<Quad>([
                quad(
                    namedNode('http://example.org/subject1'),
                    namedNode('http://example.org/predicate1'),
                    literal('value1')
                ),
                quad(
                    namedNode('http://example.org/subject2'),
                    namedNode('http://example.org/predicate1'),
                    literal('value2')
                ),
                quad(
                    namedNode('http://example.org/subject3'),
                    namedNode('http://example.org/predicate2'),
                    literal('value3')
                ),
                quad(
                    namedNode('http://example.org/subject4'),
                    namedNode('http://example.org/predicate2'),
                    literal('value4')
                )
            ]);

            const result = extractor.extractSignature(windowData);
            
            // With equal distribution of 2 predicates, entropy should be 1
            expect(result.entropy).toBeCloseTo(1, 5);
        });

        it('should handle single quad dataset', () => {
            const windowData = new Set<Quad>([
                quad(
                    namedNode('http://example.org/subject1'),
                    namedNode('http://example.org/predicate1'),
                    literal('42', namedNode('http://www.w3.org/2001/XMLSchema#integer'))
                )
            ]);

            const result = extractor.extractSignature(windowData);
            
            expect(result.tripleCount).toBe(1);
            expect(result.variance).toBe(0); // single value has no variance
            expect(result.skewness).toBe(0); // single value has no skewness
            expect(result.entropy).toBe(0); // single predicate has no entropy
            expect(result.fftEntropy).toBe(0); // single value has no FFT entropy
        });
    });

    describe('statistical calculations', () => {
        it('should calculate variance correctly for known dataset', () => {
            const windowData = new Set<Quad>([
                quad(
                    namedNode('http://example.org/s1'),
                    namedNode('http://example.org/p1'),
                    literal('1', namedNode('http://www.w3.org/2001/XMLSchema#integer'))
                ),
                quad(
                    namedNode('http://example.org/s2'),
                    namedNode('http://example.org/p1'),
                    literal('2', namedNode('http://www.w3.org/2001/XMLSchema#integer'))
                ),
                quad(
                    namedNode('http://example.org/s3'),
                    namedNode('http://example.org/p1'),
                    literal('3', namedNode('http://www.w3.org/2001/XMLSchema#integer'))
                ),
                quad(
                    namedNode('http://example.org/s4'),
                    namedNode('http://example.org/p1'),
                    literal('4', namedNode('http://www.w3.org/2001/XMLSchema#integer'))
                ),
                quad(
                    namedNode('http://example.org/s5'),
                    namedNode('http://example.org/p1'),
                    literal('5', namedNode('http://www.w3.org/2001/XMLSchema#integer'))
                )
            ]);

            const result = extractor.extractSignature(windowData);
            
            // Sample variance of [1,2,3,4,5] = 2.5
            expect(result.variance).toBeCloseTo(2.5, 5);
        });

        it('should calculate skewness for asymmetric distribution', () => {
            const windowData = new Set<Quad>([
                quad(namedNode('http://example.org/s1'), namedNode('http://example.org/p1'),
                    literal('1', namedNode('http://www.w3.org/2001/XMLSchema#integer'))),
                quad(namedNode('http://example.org/s2'), namedNode('http://example.org/p1'),
                    literal('2', namedNode('http://www.w3.org/2001/XMLSchema#integer'))),
                quad(namedNode('http://example.org/s3'), namedNode('http://example.org/p1'),
                    literal('3', namedNode('http://www.w3.org/2001/XMLSchema#integer'))),
                quad(namedNode('http://example.org/s4'), namedNode('http://example.org/p1'),
                    literal('10', namedNode('http://www.w3.org/2001/XMLSchema#integer')))
            ]);

            const result = extractor.extractSignature(windowData);
            
            // This distribution [1,2,3,10] should have positive skewness
            expect(result.skewness).toBeGreaterThan(0);
        });

        it('should handle edge cases gracefully', () => {
            const windowData = new Set<Quad>([
                quad(
                    namedNode('http://example.org/subject'),
                    namedNode('http://example.org/predicate'),
                    literal('not_a_number')
                ),
                quad(
                    namedNode('http://example.org/subject'),
                    namedNode('http://example.org/predicate'),
                    literal('NaN')
                ),
                quad(
                    namedNode('http://example.org/subject'),
                    namedNode('http://example.org/predicate'),
                    literal('')
                )
            ]);

            const result = extractor.extractSignature(windowData);
            
            expect(result.tripleCount).toBe(3);
            expect(result.variance).toBe(0); // no valid numeric values
            expect(result.skewness).toBe(0);
            expect(result.entropy).toBe(0); // all same predicate
            expect(result.fftEntropy).toBe(0); // no numeric values for FFT
        });

        it('should handle mixed numeric and non-numeric values', () => {
            const windowData = new Set<Quad>([
                quad(
                    namedNode('http://example.org/s1'),
                    namedNode('http://example.org/age'),
                    literal('25', namedNode('http://www.w3.org/2001/XMLSchema#integer'))
                ),
                quad(
                    namedNode('http://example.org/s1'),
                    namedNode('http://example.org/name'),
                    literal('John')
                ),
                quad(
                    namedNode('http://example.org/s2'),
                    namedNode('http://example.org/age'),
                    literal('30', namedNode('http://www.w3.org/2001/XMLSchema#integer'))
                ),
                quad(
                    namedNode('http://example.org/s2'),
                    namedNode('http://example.org/city'),
                    literal('New York')
                )
            ]);

            const result = extractor.extractSignature(windowData);
            
            expect(result.tripleCount).toBe(4);
            expect(result.variance).toBeCloseTo(12.5, 5); // variance of [25, 30]
            expect(result.entropy).toBeCloseTo(1.5, 1); // entropy for 3 different predicates
            expect(result.fftEntropy).toBeGreaterThan(0); // FFT entropy for mixed data
        });

        it('should calculate FFT entropy correctly for periodic data', () => {
            const windowData = new Set<Quad>([
                quad(namedNode('http://example.org/s1'), namedNode('http://example.org/p1'),
                    literal('1', namedNode('http://www.w3.org/2001/XMLSchema#integer'))),
                quad(namedNode('http://example.org/s2'), namedNode('http://example.org/p1'),
                    literal('0', namedNode('http://www.w3.org/2001/XMLSchema#integer'))),
                quad(namedNode('http://example.org/s3'), namedNode('http://example.org/p1'),
                    literal('1', namedNode('http://www.w3.org/2001/XMLSchema#integer'))),
                quad(namedNode('http://example.org/s4'), namedNode('http://example.org/p1'),
                    literal('0', namedNode('http://www.w3.org/2001/XMLSchema#integer')))
            ]);

            const result = extractor.extractSignature(windowData);
            
            // Periodic pattern [1,0,1,0] should have different FFT characteristics than random data
            expect(result.fftEntropy).toBeGreaterThan(0);
            expect(result.fftEntropy).toBeLessThan(3); // Should be less than high-entropy random data
        });
    });
});
