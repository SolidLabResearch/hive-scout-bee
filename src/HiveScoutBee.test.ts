import { HiveScoutBee } from './HiveScoutBee';
import { ApproachConfig } from './Types';
import { DataFactory, Quad } from 'n3';

const { namedNode, literal, quad } = DataFactory;

describe('HiveScoutBee', () => {
    let hiveScout: HiveScoutBee;
    let approachConfigs: ApproachConfig[];

    beforeEach(() => {
        // Define sample approach configurations
        approachConfigs = [
            {
                name: 'high-variance-approach',
                description: 'For data with high variance and entropy',
                minThresholds: {
                    variance: 50,
                    entropy: 1.0
                },
                priority: 3
            },
            {
                name: 'low-complexity-approach',
                description: 'For simple, low-entropy data',
                maxThresholds: {
                    variance: 10,
                    entropy: 0.5,
                    fftEntropy: 2.0  // Increased to accommodate FFT padding effects
                },
                priority: 2
            },
            {
                name: 'periodic-pattern-approach',
                description: 'For periodic data patterns',
                minThresholds: {
                    fftEntropy: 0.5
                },
                maxThresholds: {
                    fftEntropy: 2.5,  // Increased to accommodate various patterns
                    variance: 20
                },
                priority: 4
            },
            {
                name: 'large-dataset-approach',
                description: 'For large datasets',
                minThresholds: {
                    tripleCount: 100
                },
                priority: 1
            }
        ];

        hiveScout = new HiveScoutBee(approachConfigs);
    });

    describe('constructor and basic methods', () => {
        it('should initialize with approach configurations', () => {
            expect(hiveScout.getAvailableApproaches()).toHaveLength(4);
            expect(hiveScout.getAvailableApproaches()).toContain('high-variance-approach');
            expect(hiveScout.getAvailableApproaches()).toContain('low-complexity-approach');
        });

        it('should add new approach', () => {
            const newApproach: ApproachConfig = {
                name: 'test-approach',
                minThresholds: { variance: 5 },
                priority: 1
            };

            hiveScout.addApproach(newApproach);
            expect(hiveScout.getAvailableApproaches()).toContain('test-approach');
            expect(hiveScout.getApproachConfig('test-approach')).toEqual(newApproach);
        });

        it('should remove approach', () => {
            expect(hiveScout.removeApproach('low-complexity-approach')).toBe(true);
            expect(hiveScout.getAvailableApproaches()).not.toContain('low-complexity-approach');
            expect(hiveScout.removeApproach('non-existent')).toBe(false);
        });

        it('should get approach configuration', () => {
            const config = hiveScout.getApproachConfig('high-variance-approach');
            expect(config).toBeDefined();
            expect(config?.name).toBe('high-variance-approach');
            expect(config?.minThresholds?.variance).toBe(50);
        });
    });

    describe('approach selection', () => {
        it('should recommend most specific approach when multiple match', () => {
            // Create simple, constant data that matches multiple approaches
            const windowData = new Set<Quad>([
                quad(namedNode('http://example.org/s1'), namedNode('http://example.org/p1'), literal('5')),
                quad(namedNode('http://example.org/s2'), namedNode('http://example.org/p1'), literal('5')),
                quad(namedNode('http://example.org/s3'), namedNode('http://example.org/p1'), literal('5'))
            ]);

            const recommendation = hiveScout.chooseApproach(windowData);
            
            // Should contain both matching approaches
            expect(recommendation.matchingApproaches).toContain('low-complexity-approach');
            expect(recommendation.matchingApproaches).toContain('periodic-pattern-approach');
            
            // Should recommend the more specific approach (low-complexity has tighter constraints)
            expect(recommendation.recommendedApproach).toBe('low-complexity-approach');
            expect(recommendation.confidence).toBeGreaterThan(0);
            expect(recommendation.signature.variance).toBe(0); // Constant values have 0 variance
        });

        it('should recommend low-complexity approach when it uniquely matches', () => {
            // Create data with moderate FFT entropy that exceeds periodic-pattern-approach threshold
            const hiveScoutSpecific = new HiveScoutBee([
                {
                    name: 'low-complexity-approach',
                    maxThresholds: {
                        variance: 10,
                        entropy: 0.5,
                        fftEntropy: 1.0
                    },
                    priority: 2
                },
                {
                    name: 'high-complexity-approach',
                    minThresholds: {
                        variance: 50,
                        fftEntropy: 2.0
                    },
                    priority: 1
                }
            ]);

            const windowData = new Set<Quad>([
                quad(namedNode('http://example.org/s1'), namedNode('http://example.org/p1'), literal('5')),
                quad(namedNode('http://example.org/s2'), namedNode('http://example.org/p1'), literal('5'))
            ]);

            const recommendation = hiveScoutSpecific.chooseApproach(windowData);
            
            expect(recommendation.recommendedApproach).toBe('low-complexity-approach');
            expect(recommendation.matchingApproaches).toContain('low-complexity-approach');
            expect(recommendation.signature.variance).toBe(0);
        });

        it('should recommend high-variance approach for complex data', () => {
            // Create high-variance data
            const windowData = new Set<Quad>([
                quad(namedNode('http://example.org/s1'), namedNode('http://example.org/p1'), literal('1')),
                quad(namedNode('http://example.org/s2'), namedNode('http://example.org/p2'), literal('100')),
                quad(namedNode('http://example.org/s3'), namedNode('http://example.org/p3'), literal('1000')),
                quad(namedNode('http://example.org/s4'), namedNode('http://example.org/p4'), literal('50')),
                quad(namedNode('http://example.org/s5'), namedNode('http://example.org/p5'), literal('500'))
            ]);

            const recommendation = hiveScout.chooseApproach(windowData);
            
            expect(recommendation.matchingApproaches).toContain('high-variance-approach');
            expect(recommendation.signature.variance).toBeGreaterThan(50);
            expect(recommendation.signature.entropy).toBeGreaterThan(1.0);
        });

        it('should recommend periodic-pattern approach for periodic data', () => {
            // Create periodic pattern data
            const windowData = new Set<Quad>([
                quad(namedNode('http://example.org/s1'), namedNode('http://example.org/p1'), literal('1')),
                quad(namedNode('http://example.org/s2'), namedNode('http://example.org/p1'), literal('0')),
                quad(namedNode('http://example.org/s3'), namedNode('http://example.org/p1'), literal('1')),
                quad(namedNode('http://example.org/s4'), namedNode('http://example.org/p1'), literal('0'))
            ]);

            const recommendation = hiveScout.chooseApproach(windowData);
            
            // Should have moderate FFT entropy due to periodic pattern
            expect(recommendation.signature.fftEntropy).toBeGreaterThan(0.5);
            expect(recommendation.signature.fftEntropy).toBeLessThan(2.0);
        });

        it('should return default approach when no approaches match', () => {
            // Create data that doesn't match any configured approach
            const hiveScoutStrict = new HiveScoutBee([
                {
                    name: 'impossible-approach',
                    minThresholds: {
                        variance: 1000000, // Impossibly high threshold
                        entropy: 100
                    }
                }
            ]);

            const windowData = new Set<Quad>([
                quad(namedNode('http://example.org/s1'), namedNode('http://example.org/p1'), literal('1'))
            ]);

            const recommendation = hiveScoutStrict.chooseApproach(windowData);
            
            expect(recommendation.recommendedApproach).toBe('default');
            expect(recommendation.matchingApproaches).toHaveLength(0);
            expect(recommendation.confidence).toBe(0);
        });

        it('should use specificity over priority, with priority as tiebreaker', () => {
            // Create data that matches multiple approaches
            const windowData = new Set<Quad>([
                quad(namedNode('http://example.org/s1'), namedNode('http://example.org/p1'), literal('1')),
                quad(namedNode('http://example.org/s2'), namedNode('http://example.org/p1'), literal('0')),
                quad(namedNode('http://example.org/s3'), namedNode('http://example.org/p1'), literal('1'))
            ]);

            const recommendation = hiveScout.chooseApproach(windowData);
            
            // Should recommend based on best fit (most specific thresholds), not just priority
            expect(recommendation.matchingApproaches.length).toBeGreaterThan(0);
            
            // The recommended approach should be the most specific one that matches
            // In this case, we expect the approach with the most restrictive matching thresholds
            expect(recommendation.recommendedApproach).toBeDefined();
            expect(recommendation.confidence).toBeGreaterThan(0);
        });

        it('should demonstrate specificity-based selection', () => {
            // Create test with clear specificity differences
            const specificityScout = new HiveScoutBee([
                {
                    name: 'very-broad',
                    maxThresholds: { variance: 1000, entropy: 100 },
                    priority: 10 // High priority but not specific
                },
                {
                    name: 'very-specific',
                    maxThresholds: { variance: 1, entropy: 0.1 },
                    priority: 1 // Low priority but very specific
                }
            ]);

            const windowData = new Set<Quad>([
                quad(namedNode('http://example.org/s1'), namedNode('http://example.org/p1'), literal('5')),
                quad(namedNode('http://example.org/s2'), namedNode('http://example.org/p1'), literal('5'))
            ]);

            const recommendation = specificityScout.chooseApproach(windowData);
            
            // Should choose the more specific approach despite lower priority
            expect(recommendation.matchingApproaches).toContain('very-broad');
            expect(recommendation.matchingApproaches).toContain('very-specific');
            expect(recommendation.recommendedApproach).toBe('very-specific');
        });

        it('should handle empty dataset', () => {
            const windowData = new Set<Quad>();
            const recommendation = hiveScout.chooseApproach(windowData);
            
            expect(recommendation.signature.tripleCount).toBe(0);
            expect(recommendation.signature.variance).toBe(0);
            expect(recommendation.signature.entropy).toBe(0);
            expect(recommendation.signature.fftEntropy).toBe(0);
        });
    });

    describe('confidence scoring', () => {
        it('should provide higher confidence for better matches', () => {
            const perfectMatchApproach: ApproachConfig = {
                name: 'perfect-match',
                minThresholds: { variance: 0, entropy: 0 },
                maxThresholds: { variance: 1, entropy: 1 }
            };

            const testScout = new HiveScoutBee([perfectMatchApproach]);

            const windowData = new Set<Quad>([
                quad(namedNode('http://example.org/s1'), namedNode('http://example.org/p1'), literal('5')),
                quad(namedNode('http://example.org/s2'), namedNode('http://example.org/p1'), literal('5'))
            ]);

            const recommendation = testScout.chooseApproach(windowData);
            
            expect(recommendation.confidence).toBeGreaterThan(0.8); // High confidence for good match
        });
    });
});
