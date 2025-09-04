import { SignatureExtractor } from './extractor/SignatureExtractor';
import { ApproachConfig, ApproachRecommendation, StreamSignature } from './Types';
import { Quad } from 'n3';

/**
 * HiveScoutBee class for adaptive approach selection based on stream signatures.
 * Allows configuration of different approaches with custom thresholds for variance,
 * skewness, entropy, fftEntropy, and other metrics.
 * @export
 * @class HiveScoutBee
 */
export class HiveScoutBee {
    private approachConfigs: Map<string, ApproachConfig>;
    private signatureExtractor: SignatureExtractor;

    /**
     * Creates an instance of HiveScoutBee.
     * @param {ApproachConfig[]} approaches - Array of approach configurations with their thresholds
     * @memberof HiveScoutBee
     */
    constructor(approaches: ApproachConfig[]) {
        this.approachConfigs = new Map();
        this.signatureExtractor = new SignatureExtractor();
        
        // Store approach configurations
        for (const approach of approaches) {
            this.approachConfigs.set(approach.name, approach);
        }
    }

    /**
     * Analyzes the stream data and recommends the best approach based on configured thresholds.
     * Selection is based on best fit (most specific matching thresholds) rather than priority.
     * @param {Set<Quad>} windowData - The RDF quad data to analyze
     * @return {ApproachRecommendation} - The recommendation with matching approaches and confidence
     * @memberof HiveScoutBee
     */
    public chooseApproach(windowData: Set<Quad>): ApproachRecommendation {
        // Extract signature from the data
        const signature = this.signatureExtractor.extractSignature(windowData);
        
        // Find all matching approaches with their specificity scores
        const matchingApproaches: string[] = [];
        const approachEvaluations: Array<{ 
            name: string; 
            score: number; 
            specificity: number; 
            priority: number 
        }> = [];

        for (const [approachName, config] of this.approachConfigs) {
            const matchResult = this.evaluateApproach(signature, config);
            
            if (matchResult.matches) {
                const specificity = this.calculateSpecificity(signature, config);
                matchingApproaches.push(approachName);
                approachEvaluations.push({
                    name: approachName,
                    score: matchResult.score,
                    specificity: specificity,
                    priority: config.priority || 0
                });
            }
        }

        // Select the best approach based on specificity first, then priority as tiebreaker
        let recommendedApproach = 'default';
        let confidence = 0;

        if (approachEvaluations.length > 0) {
            // Sort by specificity first (higher = more specific), then by priority
            approachEvaluations.sort((a, b) => {
                if (Math.abs(a.specificity - b.specificity) > 0.01) {
                    return b.specificity - a.specificity; // Higher specificity first
                }
                return b.priority - a.priority; // Higher priority as tiebreaker
            });

            recommendedApproach = approachEvaluations[0].name;
            confidence = Math.min(approachEvaluations[0].score, 1.0);
        }

        return {
            recommendedApproach,
            matchingApproaches,
            signature,
            confidence
        };
    }

    /**
     * Adds a new approach configuration.
     * @param {ApproachConfig} approach - The approach configuration to add
     * @memberof HiveScoutBee
     */
    public addApproach(approach: ApproachConfig): void {
        this.approachConfigs.set(approach.name, approach);
    }

    /**
     * Removes an approach configuration.
     * @param {string} approachName - The name of the approach to remove
     * @return {boolean} - True if the approach was removed, false if it didn't exist
     * @memberof HiveScoutBee
     */
    public removeApproach(approachName: string): boolean {
        return this.approachConfigs.delete(approachName);
    }

    /**
     * Gets all configured approach names.
     * @return {string[]} - Array of approach names
     * @memberof HiveScoutBee
     */
    public getAvailableApproaches(): string[] {
        return Array.from(this.approachConfigs.keys());
    }

    /**
     * Gets the configuration for a specific approach.
     * @param {string} approachName - The name of the approach
     * @return {ApproachConfig | undefined} - The approach configuration or undefined if not found
     * @memberof HiveScoutBee
     */
    public getApproachConfig(approachName: string): ApproachConfig | undefined {
        return this.approachConfigs.get(approachName);
    }

    /**
     * Calculates the specificity of an approach for the given signature.
     * More restrictive thresholds = higher specificity.
     * @private
     * @param {StreamSignature} signature - The stream signature
     * @param {ApproachConfig} config - The approach configuration
     * @return {number} - Specificity score (higher = more specific)
     * @memberof HiveScoutBee
     */
    private calculateSpecificity(signature: StreamSignature, config: ApproachConfig): number {
        let specificityScore = 0;
        let thresholdCount = 0;

        // For min thresholds: closer to actual value = more specific
        if (config.minThresholds) {
            const minChecks = [
                { threshold: config.minThresholds.variance, value: signature.variance },
                { threshold: config.minThresholds.skewness, value: signature.skewness },
                { threshold: config.minThresholds.entropy, value: signature.entropy },
                { threshold: config.minThresholds.fftEntropy, value: signature.fftEntropy },
                { threshold: config.minThresholds.tripleCount, value: signature.tripleCount }
            ];

            for (const check of minChecks) {
                if (check.threshold !== undefined) {
                    thresholdCount++;
                    // Higher threshold relative to value = more specific
                    if (check.value > 0) {
                        specificityScore += check.threshold / (check.value + 1);
                    } else {
                        specificityScore += check.threshold;
                    }
                }
            }
        }

        // For max thresholds: lower threshold = more specific/restrictive
        if (config.maxThresholds) {
            const maxChecks = [
                { threshold: config.maxThresholds.variance, value: signature.variance },
                { threshold: config.maxThresholds.skewness, value: signature.skewness },
                { threshold: config.maxThresholds.entropy, value: signature.entropy },
                { threshold: config.maxThresholds.fftEntropy, value: signature.fftEntropy },
                { threshold: config.maxThresholds.tripleCount, value: signature.tripleCount }
            ];

            for (const check of maxChecks) {
                if (check.threshold !== undefined) {
                    thresholdCount++;
                    // Lower threshold = more restrictive = more specific
                    // Use inverse relationship: 1 / (threshold + 1)
                    specificityScore += 1 / (check.threshold + 1);
                }
            }
        }

        // Normalize by number of thresholds
        return thresholdCount > 0 ? specificityScore / thresholdCount : 0;
    }

    /**
     * Evaluates whether a signature matches an approach's criteria.
     * @private
     * @param {StreamSignature} signature - The stream signature to evaluate
     * @param {ApproachConfig} config - The approach configuration
     * @return {{ matches: boolean; score: number }} - Match result and confidence score
     * @memberof HiveScoutBee
     */
    private evaluateApproach(signature: StreamSignature, config: ApproachConfig): { matches: boolean; score: number } {
        let matches = true;
        let totalScore = 0;
        let criteriaCount = 0;

        // Check minimum thresholds
        if (config.minThresholds) {
            const minChecks = [
                { threshold: config.minThresholds.variance, value: signature.variance },
                { threshold: config.minThresholds.skewness, value: signature.skewness },
                { threshold: config.minThresholds.entropy, value: signature.entropy },
                { threshold: config.minThresholds.fftEntropy, value: signature.fftEntropy },
                { threshold: config.minThresholds.tripleCount, value: signature.tripleCount }
            ];

            for (const check of minChecks) {
                if (check.threshold !== undefined) {
                    criteriaCount++;
                    if (check.value >= check.threshold) {
                        totalScore += 1.0;
                    } else {
                        matches = false;
                        totalScore += Math.max(0, check.value / check.threshold);
                    }
                }
            }
        }

        // Check maximum thresholds
        if (config.maxThresholds) {
            const maxChecks = [
                { threshold: config.maxThresholds.variance, value: signature.variance },
                { threshold: config.maxThresholds.skewness, value: signature.skewness },
                { threshold: config.maxThresholds.entropy, value: signature.entropy },
                { threshold: config.maxThresholds.fftEntropy, value: signature.fftEntropy },
                { threshold: config.maxThresholds.tripleCount, value: signature.tripleCount }
            ];

            for (const check of maxChecks) {
                if (check.threshold !== undefined) {
                    criteriaCount++;
                    if (check.value <= check.threshold) {
                        totalScore += 1.0;
                    } else {
                        matches = false;
                        totalScore += Math.max(0, check.threshold / check.value);
                    }
                }
            }
        }

        const score = criteriaCount > 0 ? totalScore / criteriaCount : 0;
        return { matches, score };
    }
}