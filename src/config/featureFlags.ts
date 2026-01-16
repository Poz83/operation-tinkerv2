/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Feature Flags Configuration
 * Toggle features on/off across the application
 */

export interface FeatureFlags {
    // Image Generation
    imageGeneration: {
        enabled: boolean;
        allowHighResolution: boolean;
        allow4KOutput: boolean;
        enableQAChecks: boolean;
    };

    // Prompt Generation
    promptGeneration: {
        enabled: boolean;
        enableEnhancement: boolean;
        enableBrainstorming: boolean;
    };

    // Hero Lab (Character Illustrations)
    heroLab: {
        enabled: boolean;
        enableCharacterGeneration: boolean;
        enableStyleTransfer: boolean;
    };

    // Cover Creator
    coverCreator: {
        enabled: boolean;
    };

    // Monochrome Maker
    monochromeMaker: {
        enabled: boolean;
    };

    // Storybook Creator
    storybookCreator: {
        enabled: boolean;
    };

    // Paint by Numbers
    paintByNumbers: {
        enabled: boolean;
    };

    // Development Features
    dev: {
        enableBatchLogging: boolean;
        enableDebugMode: boolean;
    };
}

/**
 * Default feature flag configuration
 * Modify these values to enable/disable features
 */
export const featureFlags: FeatureFlags = {
    // Image Generation - Core coloring book generation
    imageGeneration: {
        enabled: true,
        allowHighResolution: true,
        allow4KOutput: true,
        enableQAChecks: true,
    },

    // Prompt Generation - AI prompt enhancement
    promptGeneration: {
        enabled: true,
        enableEnhancement: true,
        enableBrainstorming: true,
    },

    // Hero Lab - Character illustration tool
    heroLab: {
        enabled: true,
        enableCharacterGeneration: true,
        enableStyleTransfer: true,
    },

    // Cover Creator - Book cover generation
    coverCreator: {
        enabled: false, // Coming soon
    },

    // Monochrome Maker - B&W art conversion
    monochromeMaker: {
        enabled: false, // Coming soon
    },

    // Storybook Creator - Illustrated stories
    storybookCreator: {
        enabled: false, // Coming soon
    },

    // Paint by Numbers - Number art generation
    paintByNumbers: {
        enabled: false, // Coming soon
    },

    // Development Features
    dev: {
        enableBatchLogging: process.env.NODE_ENV === 'development',
        enableDebugMode: false,
    },
};

/**
 * Helper function to check if a feature is enabled
 */
export function isFeatureEnabled(
    category: keyof FeatureFlags,
    feature?: string
): boolean {
    const categoryConfig = featureFlags[category];

    if (typeof categoryConfig === 'object' && categoryConfig !== null) {
        if (feature && feature in categoryConfig) {
            return (categoryConfig as Record<string, boolean>)[feature] ?? false;
        }
        return 'enabled' in categoryConfig ? categoryConfig.enabled : true;
    }

    return false;
}

export default featureFlags;
