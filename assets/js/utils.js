// Utility functions

export async function loadModelsData(baseUrl = 'assets/data', retries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            // Load all three JSON files in parallel
            const [metadataResponse, nodesResponse, linksResponse] = await Promise.all([
                fetch(`${baseUrl}/metadata.json`),
                fetch(`${baseUrl}/nodes.json`),
                fetch(`${baseUrl}/links.json`)
            ]);

            // Check if all responses are OK
            if (!metadataResponse.ok) {
                throw new Error(`Failed to load metadata: HTTP ${metadataResponse.status} - ${metadataResponse.statusText}`);
            }
            if (!nodesResponse.ok) {
                throw new Error(`Failed to load nodes: HTTP ${nodesResponse.status} - ${nodesResponse.statusText}`);
            }
            if (!linksResponse.ok) {
                throw new Error(`Failed to load links: HTTP ${linksResponse.status} - ${linksResponse.statusText}`);
            }

            // Parse all JSON responses
            let metadata, nodes, links;
            try {
                [metadata, nodes, links] = await Promise.all([
                    metadataResponse.json(),
                    nodesResponse.json(),
                    linksResponse.json()
                ]);
            } catch (parseError) {
                throw new Error('Invalid JSON format in one or more data files');
            }

            // Merge the data into the expected format
            const data = {
                metadata: metadata,
                categories: metadata.categories,
                linkTypes: metadata.linkTypes,
                nodes: nodes,
                links: links
            };

            return validateData(data);
        } catch (error) {
            console.error(`Error loading models data (attempt ${attempt}/${retries}):`, error);
            
            // If this is the last attempt, throw the error
            if (attempt === retries) {
                // Provide more specific error messages
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    throw new Error('Network error: Unable to fetch data. Please check your connection.');
                }
                throw error;
            }
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
            console.log(`Retrying data load (${attempt + 1}/${retries})...`);
        }
    }
}

export function validateData(data) {
    // Basic validation
    if (!data.nodes || !Array.isArray(data.nodes)) {
        throw new Error('Invalid data: missing nodes array');
    }
    
    if (!data.links || !Array.isArray(data.links)) {
        throw new Error('Invalid data: missing links array');
    }
    
    if (!data.categories || typeof data.categories !== 'object') {
        throw new Error('Invalid data: missing categories object');
    }
    
    if (!data.linkTypes || typeof data.linkTypes !== 'object') {
        throw new Error('Invalid data: missing linkTypes object');
    }
    
    // Validate node structure
    data.nodes.forEach((node, index) => {
        if (!node.id || !node.name || !node.category || !node.year) {
            throw new Error(`Invalid node at index ${index}: missing required fields`);
        }
    });
    
    // Validate links structure
    data.links.forEach((link, index) => {
        if (!link.source || !link.target || !link.type) {
            throw new Error(`Invalid link at index ${index}: missing required fields`);
        }
    });
    
    return data;
}

export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}



// Math rendering utilities
export function processMathInText(text) {
    if (!text) return text;
    
    // Common mathematical expressions in the data that need LaTeX formatting
    let processedText = text
        // Replace common mathematical notation
        .replace(/\bELBO\b/g, '$\\text{ELBO}$')
        .replace(/\bKL\b(?!\s*divergence)/g, '$\\text{KL}$')
        .replace(/KL divergence/g, '$\\text{KL}$ divergence')
        .replace(/log\(([^)]+)\)/g, '$\\log($1)$')
        .replace(/\blog\s+/g, '$\\log$ ')
        .replace(/\bexp\(/g, '$\\exp($')
        .replace(/q\(([^)]+)\)/g, '$q($1)$')
        .replace(/p_θ\(([^)]+)\)/g, '$p_\\theta($1)$')
        .replace(/p_\\theta\(([^)]+)\)/g, '$p_\\theta($1)$')
        .replace(/G\(z\)/g, '$G(z)$')
        .replace(/D\(([^)]+)\)/g, '$D($1)$')
        .replace(/E\(([^)]+)\)/g, '$E($1)$')
        // Handle subscripts and superscripts
        .replace(/x_(\d+)/g, '$x_{$1}$')
        .replace(/x_\{([^}]+)\}/g, '$x_{$1}$')
        .replace(/z_(\d+)/g, '$z_{$1}$')
        .replace(/t_(\d+)/g, '$t_{$1}$')
        .replace(/x_{t-1}/g, '$x_{t-1}$')
        .replace(/x_{t\+1}/g, '$x_{t+1}$')
        // Handle Greek letters
        .replace(/β > 1/g, '$\\beta > 1$')  
        .replace(/β = 1/g, '$\\beta = 1$')
        .replace(/\bβ\b/g, '$\\beta$')
        .replace(/\bθ\b/g, '$\\theta$')
        .replace(/\bε\b/g, '$\\varepsilon$')
        .replace(/\bμ\b/g, '$\\mu$')
        .replace(/\bσ\b/g, '$\\sigma$')
        .replace(/\bα\b/g, '$\\alpha$')
        // Handle mathematical expressions
        .replace(/E\[([^\]]+)\]/g, '$\\mathbb{E}[$1]$')
        .replace(/\bVAE\b(?=\s|$|\.)/g, '$\\text{VAE}$')
        .replace(/\bGAN\b(?=\s|$|\.)/g, '$\\text{GAN}$')
        .replace(/\bU-Net\b/g, '$\\text{U-Net}$')
        .replace(/PixelCNN/g, '$\\text{PixelCNN}$')
        .replace(/AdaIN/g, '$\\text{AdaIN}$')
        // Handle arrows and mappings
        .replace(/f:Z→W/g, '$f: \\mathcal{Z} \\to \\mathcal{W}$')
        .replace(/→/g, '$\\to$')
        .replace(/x→z/g, '$x \\to z$')
        .replace(/z→x/g, '$z \\to x$')
        // Handle inequalities and comparisons
        .replace(/≥/g, '$\\geq$')
        .replace(/≤/g, '$\\leq$')
        .replace(/>/g, '$>$')
        .replace(/</g, '$<$')
        // Handle mathematical operators in context
        .replace(/\s\+\s/g, ' $+$ ')
        .replace(/\s-\s/g, ' $-$ ')
        .replace(/\s\*\s/g, ' $\\cdot$ ')
        // Fix any double dollar signs that might have been created
        .replace(/\$\$+/g, '$');
    
    return processedText;
}

// Function to render math in a DOM element after content is added
export function renderMathInElement(element) {
    if (!element) {
        console.warn('renderMathInElement: No element provided');
        return Promise.resolve();
    }

    if (window.MathJax && window.MathJax.typesetPromise) {
        return window.MathJax.typesetPromise([element]).catch((err) => {
            console.warn('MathJax rendering error:', err);
        });
    } else {
        // If MathJax is not ready, wait for it with timeout
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds max wait time
            
            const checkMathJax = () => {
                if (window.MathJax && window.MathJax.typesetPromise) {
                    window.MathJax.typesetPromise([element])
                        .then(resolve)
                        .catch((err) => {
                            console.warn('MathJax rendering error:', err);
                            reject(err);
                        });
                } else {
                    attempts++;
                    if (attempts < maxAttempts) {
                        setTimeout(checkMathJax, 100);
                    } else {
                        console.warn('MathJax failed to load after 5 seconds');
                        resolve(); // Resolve anyway to prevent hanging
                    }
                }
            };
            checkMathJax();
        });
    }
}