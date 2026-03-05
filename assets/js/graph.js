// Graph visualization module
import { processMathInText, renderMathInElement } from './utils.js';

class GraphVisualization {
    constructor(containerId, data) {
        this.containerId = containerId;
        this.data = this.processData(data);
        this.container = document.getElementById(containerId);
        
        // D3 selections
        this.svg = null;
        this.g = null;
        this.simulation = null;
        this.link = null;
        this.linkLabel = null;
        this.node = null;
        
        // State
        this.selectedNode = null;
        this.activeCategories = new Set(Object.keys(data.categories));
        this.activeLinkTypes = new Set(Object.keys(data.linkTypes));
        this.yearRange = { min: 2013, max: 2024 };
        this.currentTransform = d3.zoomIdentity;
        this.zoom = null;
        
        // Minimap
        this.minimapSvg = null;
        this.minimapG = null;
        this.minimapViewport = null;
        this.minimapScale = 0.1;
        
        // Initialize
        this.init();
    }

    processData(rawData) {
        // Create node map for efficient lookup
        const nodeMap = new Map(rawData.nodes.map(node => [node.id, node]));
        
        // Process links to use node objects instead of IDs
        const processedLinks = rawData.links.map(link => ({
            ...link,
            source: nodeMap.get(link.source),
            target: nodeMap.get(link.target)
        }));
        
        return {
            ...rawData,
            links: processedLinks,
            nodeMap
        };
    }

    init() {
        this.setupSVG();
        this.setupMinimap();
        this.setupSimulation();
        this.render();
        this.setupZoom();
    }

    setupSVG() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.svg = d3.select(`#${this.containerId}`)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .on('click', () => this.deselectNode());
        
        // Add arrow markers for links
        const defs = this.svg.append('defs');
        
        Object.entries(this.data.linkTypes).forEach(([type, config]) => {
            defs.append('marker')
                .attr('id', `arrow-${type}`)
                .attr('viewBox', '0 -5 10 10')
                .attr('refX', 25)
                .attr('refY', 0)
                .attr('markerWidth', 6)
                .attr('markerHeight', 6)
                .attr('orient', 'auto')
                .append('path')
                .attr('d', 'M0,-5L10,0L0,5')
                .attr('fill', config.color);
        });
        
        this.g = this.svg.append('g');
    }

    setupMinimap() {
        const minimapEl = document.getElementById('minimap');
        const mmWidth = minimapEl.clientWidth;
        const mmHeight = minimapEl.clientHeight;
        
        this.minimapSvg = d3.select('#minimap-svg')
            .attr('width', mmWidth)
            .attr('height', mmHeight);
        
        this.minimapG = this.minimapSvg.append('g');
        
        // Viewport rectangle (shows what the user currently sees)
        this.minimapViewport = this.minimapSvg.append('rect')
            .attr('class', 'minimap-viewport')
            .attr('fill', 'rgba(59, 130, 246, 0.08)')
            .attr('stroke', 'rgba(59, 130, 246, 0.4)')
            .attr('stroke-width', 1)
            .attr('rx', 2);
        
        // Click on minimap to pan
        this.minimapSvg.on('click', (event) => {
            const [mx, my] = d3.pointer(event);
            this.panToMinimapPoint(mx, my);
        });
    }

    updateMinimap() {
        if (!this.minimapG || !this.data.nodes) return;
        
        const nodes = this.getFilteredData().nodes;
        const links = this.getFilteredData().links;
        
        if (nodes.length === 0) return;
        
        // Calculate bounds of all nodes
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        nodes.forEach(d => {
            if (d.x !== undefined && d.y !== undefined) {
                minX = Math.min(minX, d.x - 30);
                minY = Math.min(minY, d.y - 30);
                maxX = Math.max(maxX, d.x + 30);
                maxY = Math.max(maxY, d.y + 30);
            }
        });
        
        if (!isFinite(minX)) return;
        
        // Add padding
        const pad = 80;
        minX -= pad; minY -= pad; maxX += pad; maxY += pad;
        
        const graphW = maxX - minX;
        const graphH = maxY - minY;
        
        const minimapEl = document.getElementById('minimap');
        const mmW = minimapEl.clientWidth;
        const mmH = minimapEl.clientHeight;
        
        const scale = Math.min(mmW / graphW, mmH / graphH);
        const offsetX = (mmW - graphW * scale) / 2;
        const offsetY = (mmH - graphH * scale) / 2;
        
        this.minimapG.attr('transform', `translate(${offsetX}, ${offsetY}) scale(${scale}) translate(${-minX}, ${-minY})`);
        
        // Draw links
        const minimapLinks = this.minimapG.selectAll('.minimap-link')
            .data(links, d => `${d.source.id}-${d.target.id}`);
        
        minimapLinks.exit().remove();
        
        minimapLinks.enter()
            .append('line')
            .attr('class', 'minimap-link')
            .merge(minimapLinks)
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y)
            .attr('stroke', 'rgba(100, 116, 139, 0.15)')
            .attr('stroke-width', 1 / scale);
        
        // Draw nodes
        const minimapNodes = this.minimapG.selectAll('.minimap-node')
            .data(nodes, d => d.id);
        
        minimapNodes.exit().remove();
        
        minimapNodes.enter()
            .append('circle')
            .attr('class', 'minimap-node')
            .merge(minimapNodes)
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', 3 / scale)
            .attr('fill', d => this.data.categories[d.category].color);
        
        // Update viewport rectangle
        this.updateMinimapViewport(minX, minY, graphW, graphH, scale, offsetX, offsetY, mmW, mmH);
        
        // Store for panToMinimapPoint
        this._minimapTransform = { minX, minY, scale, offsetX, offsetY };
    }

    updateMinimapViewport(minX, minY, graphW, graphH, mmScale, offsetX, offsetY, mmW, mmH) {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        const t = this.currentTransform;
        
        // The visible area in graph coordinates
        const visX = (-t.x) / t.k;
        const visY = (-t.y) / t.k;
        const visW = width / t.k;
        const visH = height / t.k;
        
        // Map to minimap coordinates
        const rx = offsetX + (visX - minX) * mmScale;
        const ry = offsetY + (visY - minY) * mmScale;
        const rw = visW * mmScale;
        const rh = visH * mmScale;
        
        this.minimapViewport
            .attr('x', rx)
            .attr('y', ry)
            .attr('width', rw)
            .attr('height', rh);
    }

    panToMinimapPoint(mx, my) {
        if (!this._minimapTransform) return;
        const { minX, minY, scale, offsetX, offsetY } = this._minimapTransform;
        
        // Convert minimap coords to graph coords
        const gx = (mx - offsetX) / scale + minX;
        const gy = (my - offsetY) / scale + minY;
        
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        const t = this.currentTransform;
        
        // Centre the view on (gx, gy)
        const newX = width / 2 - gx * t.k;
        const newY = height / 2 - gy * t.k;
        
        this.svg.transition().duration(300)
            .call(this.zoom.transform, d3.zoomIdentity.translate(newX, newY).scale(t.k));
    }

    setupSimulation() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.simulation = d3.forceSimulation()
            .force('link', d3.forceLink()
                .id(d => d.id)
                .distance(200)
                .strength(0.8))
            .force('charge', d3.forceManyBody()
                .strength(-1200))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide()
                .radius(d => d.size + 15)
                .strength(0.9))
            .force('x', d3.forceX(width / 2).strength(0.02))
            .force('y', d3.forceY(height / 2).strength(0.02));
    }

    setupZoom() {
        this.zoom = d3.zoom()
            .scaleExtent([0.3, 7])
            .on('zoom', (event) => {
                this.currentTransform = event.transform;
                this.g.attr('transform', event.transform);
                this.updateMinimap();
            });
        
        this.svg.call(this.zoom);
        
        // Initial zoom
        this.svg.call(this.zoom.transform, d3.zoomIdentity.scale(0.8));
    }

    render() {
        const filteredData = this.getFilteredData();
        
        // Update simulation
        this.simulation.nodes(filteredData.nodes);
        this.simulation.force('link').links(filteredData.links);
        
        // Render links
        this.renderLinks(filteredData.links);
        
        // Render link labels
        this.renderLinkLabels(filteredData.links);
        
        // Render nodes
        this.renderNodes(filteredData.nodes);
        
        // Restart simulation
        this.simulation.alpha(1).restart();
        
        // Setup tick handler
        this.simulation.on('tick', () => this.tick());
    }

    renderLinks(links) {
        this.link = this.g.selectAll('.link')
            .data(links, d => `${d.source.id}-${d.target.id}`);
        
        // Exit
        this.link.exit()
            .transition()
            .duration(300)
            .style('stroke-opacity', 0)
            .remove();
        
        // Enter + Update
        this.link = this.link.enter()
            .append('line')
            .attr('class', 'link')
            .style('stroke-opacity', 0)
            .merge(this.link);
        
        this.link
            .transition()
            .duration(300)
            .style('stroke-opacity', 0.5)
            .attr('stroke-width', 1.5)
            .attr('stroke', d => this.data.linkTypes[d.type].color)
            .attr('marker-end', d => `url(#arrow-${d.type})`);
    }

    renderLinkLabels(links) {
        this.linkLabel = this.g.selectAll('.link-label')
            .data(links, d => `${d.source.id}-${d.target.id}`);
        
        // Exit
        this.linkLabel.exit()
            .transition()
            .duration(300)
            .style('opacity', 0)
            .remove();
        
        // Enter
        const labelEnter = this.linkLabel.enter()
            .append('text')
            .attr('class', 'link-label')
            .style('opacity', 0);
        
        // Merge and update
        this.linkLabel = labelEnter.merge(this.linkLabel);
        
        this.linkLabel
            .text(d => this.data.linkTypes[d.type].label)
            .attr('fill', d => this.data.linkTypes[d.type].color)
            .attr('text-anchor', 'middle')
            .attr('font-size', '10px')
            .attr('font-weight', '500')
            .attr('pointer-events', 'none');
    }

    renderNodes(nodes) {
        this.node = this.g.selectAll('.node')
            .data(nodes, d => d.id);
        
        // Exit
        this.node.exit()
            .transition()
            .duration(300)
            .style('opacity', 0)
            .remove();
        
        // Enter
        const nodeEnter = this.node.enter()
            .append('g')
            .attr('class', 'node')
            .style('opacity', 0);
        
        nodeEnter.append('circle');
        nodeEnter.append('text');
        
        // Merge
        this.node = nodeEnter.merge(this.node);
        
        // Update
        this.node.transition()
            .duration(300)
            .style('opacity', 1);
        
        this.node.select('circle')
            .attr('r', d => d.size)
            .attr('fill', d => this.data.categories[d.category].color)
            .attr('stroke', '#ffffff')
            .on('click', (event, d) => this.selectNode(event, d))
            .on('mouseover', (event, d) => this.highlightConnections(d))
            .on('mouseout', () => this.unhighlightConnections())
            .call(this.drag());
        
        this.node.select('text')
            .attr('class', 'node-label')
            .attr('dy', d => d.size + 15)
            .text(d => d.name);
    }

    drag() {
        return d3.drag()
            .on('start', (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });
    }

    tick() {
        if (this.link) {
            this.link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
        }
        
        if (this.linkLabel) {
            this.linkLabel
                .attr('x', d => (d.source.x + d.target.x) / 2)
                .attr('y', d => (d.source.y + d.target.y) / 2);
        }
        
        if (this.node) {
            this.node.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
        }
        
        this.updateMinimap();
    }

    getFilteredData() {
        // Filter nodes by year range
        const filteredNodes = this.data.nodes.filter(d => 
            d.year >= this.yearRange.min && 
            d.year <= this.yearRange.max && 
            this.activeCategories.has(d.category)
        );
        
        const filteredNodeIds = new Set(filteredNodes.map(d => d.id));
        
        // Filter links
        const filteredLinks = this.data.links.filter(l =>
            filteredNodeIds.has(l.source.id) &&
            filteredNodeIds.has(l.target.id) &&
            this.activeLinkTypes.has(l.type)
        );
        
        return { nodes: filteredNodes, links: filteredLinks };
    }

    selectNode(event, node) {
        event.stopPropagation();
        this.selectedNode = node;
        this.showInfoPanel(node);
    }

    deselectNode() {
        this.selectedNode = null;
        this.hideInfoPanel();
    }

    showInfoPanel(node) {
        const panel = document.getElementById('info-panel');
        const category = this.data.categories[node.category];
        
        // Build papers HTML
        let papersHTML = '';
        if (node.papers && node.papers.length > 0) {
            papersHTML = node.papers.map(paper => `
                <a href="${paper.url}" target="_blank" rel="noopener noreferrer" 
                   class="group flex items-start gap-2 py-1.5 text-slate-400 hover:text-sky-400 transition-colors duration-200 text-xs leading-relaxed">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 flex-shrink-0 mt-0.5 opacity-40 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>${paper.title} <span class="opacity-50">(${paper.year})</span></span>
                </a>
            `).join('');
        }
        
        // Build code links HTML
        let codeHTML = '';
        if (node.code && node.code.length > 0) {
            codeHTML = `
                <div class="info-section">
                    <h3 class="info-section-title">Code</h3>
                    <div class="flex flex-wrap gap-1.5">
                        ${node.code.map(code => `
                            <a href="${code.url}" target="_blank" 
                               class="px-2 py-0.5 rounded text-xs transition-colors"
                               style="background: rgba(100,116,139,0.1); color: #8b949e;"
                               onmouseover="this.style.background='rgba(100,116,139,0.2)'"
                               onmouseout="this.style.background='rgba(100,116,139,0.1)'"
                            >${code.language}</a>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        // Build key contributions HTML
        let contributionsHTML = '';
        if (node.keyContributions && node.keyContributions.length > 0) {
            contributionsHTML = `
                <div class="info-section">
                    <h3 class="info-section-title">Key Contributions</h3>
                    <ul class="space-y-1.5 text-xs text-slate-400 leading-relaxed">
                        ${node.keyContributions.map(c => `
                            <li class="flex items-start gap-2">
                                <span class="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style="background: ${category.color}; opacity: 0.5;"></span>
                                <span>${processMathInText(c)}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }
        
        panel.innerHTML = `
            <button id="close-panel" class="absolute top-5 right-5 z-10">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            
            <div class="flex flex-col" style="padding: 1.5rem;">
                <!-- Header -->
                <div style="padding-bottom: 1.25rem; border-bottom: 1px solid rgba(100,116,139,0.12);">
                    <div class="flex items-center gap-2 mb-2">
                        <span class="w-2 h-2 rounded-full flex-shrink-0" style="background-color: ${category.color};"></span>
                        <span style="color: ${category.color}; font-size: 0.6875rem; font-weight: 500; letter-spacing: 0.03em; opacity: 0.8;">${category.name}</span>
                        <span style="color: rgba(139,148,158,0.3); font-size: 0.6875rem;">•</span>
                        <span style="color: rgba(139,148,158,0.5); font-size: 0.6875rem;">${node.year}</span>
                    </div>
                    <h2 class="text-white" style="font-size: 1.25rem; font-weight: 600; letter-spacing: -0.02em; line-height: 1.3;">${node.fullName}</h2>
                    <p style="color: rgba(139,148,158,0.5); font-size: 0.75rem; margin-top: 2px;">${node.name}</p>
                </div>
                
                <!-- Description -->
                <div class="info-section">
                    <p style="color: #8b949e; font-size: 0.8125rem; line-height: 1.7;">${processMathInText(node.description)}</p>
                </div>
                
                <!-- Main Idea -->
                <div class="info-section" style="padding: 0.875rem; border-radius: 0.5rem; border-left: 2px solid ${category.color}; background: rgba(100,116,139,0.06);">
                    <h3 class="info-section-title" style="margin-bottom: 0.375rem;">Main Idea</h3>
                    <p style="color: #6e7681; font-size: 0.75rem; line-height: 1.7;">${processMathInText(node.mainIdea)}</p>
                </div>
                
                ${contributionsHTML}
                
                <!-- Publications -->
                <div class="info-section">
                    <h3 class="info-section-title">Publications</h3>
                    <div class="flex flex-col">${papersHTML}</div>
                </div>
                
                ${codeHTML}
                
                ${node.tags ? `
                    <div class="info-section" style="padding-top: 0.75rem; border-top: 1px solid rgba(100,116,139,0.08);">
                        <div class="flex flex-wrap gap-1.5">
                            ${node.tags.map(tag => `
                                <span style="font-size: 0.6875rem; padding: 0.125rem 0.5rem; border-radius: 9999px; background: rgba(100,116,139,0.08); color: rgba(139,148,158,0.6);">
                                    ${tag}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        // Show panel with consistent animation
        panel.classList.add('show');
        
        // Render mathematical expressions
        renderMathInElement(panel);
        
        // Setup close button
        document.getElementById('close-panel').addEventListener('click', () => {
            this.deselectNode();
        });
    }

    hideInfoPanel() {
        const panel = document.getElementById('info-panel');
        panel.classList.remove('show');
    }

    highlightConnections(node) {
        const isConnected = (a, b) => {
            return this.data.links.some(l => 
                (l.source.id === a.id && l.target.id === b.id) ||
                (l.source.id === b.id && l.target.id === a.id)
            );
        };
        
        // Fade non-connected nodes
        this.node.classed('faded', n => n.id !== node.id && !isConnected(node, n));
        
        // Highlight connected links
        this.link
            .classed('highlighted', l => l.source.id === node.id || l.target.id === node.id)
            .classed('faded', l => l.source.id !== node.id && l.target.id !== node.id);
        
        // Show labels for highlighted links
        if (this.linkLabel) {
            this.linkLabel
                .style('opacity', l => (l.source.id === node.id || l.target.id === node.id) ? 1 : 0);
        }
    }

    unhighlightConnections() {
        this.node.classed('faded', false);
        this.link.classed('highlighted', false).classed('faded', false);
        
        // Hide link labels
        if (this.linkLabel) {
            this.linkLabel.style('opacity', 0);
        }
    }

    filterByYearRange(minYear, maxYear) {
        this.yearRange.min = minYear;
        this.yearRange.max = maxYear;
        this.render();
    }

    toggleLinkType(type, active) {
        if (active) {
            this.activeLinkTypes.add(type);
        } else {
            this.activeLinkTypes.delete(type);
        }
        this.render();
    }

    toggleCategory(category, active) {
        if (active) {
            this.activeCategories.add(category);
        } else {
            this.activeCategories.delete(category);
        }
        this.render();
    }

    searchNodes(query) {
        const lowerQuery = query.toLowerCase().trim();
        
        if (!query) {
            // Reset all nodes and links to normal opacity
            this.node.style('opacity', 1);
            this.link.style('opacity', 0.5);
            this.node.classed('search-highlighted', false);
            return;
        }
        
        // Find matching nodes
        const matchingNodes = new Set();
        
        // Fade nodes that don't match and highlight those that do
        this.node.style('opacity', d => {
            const matches = d.name.toLowerCase().includes(lowerQuery) ||
                          d.fullName.toLowerCase().includes(lowerQuery) ||
                          (d.description && d.description.toLowerCase().includes(lowerQuery)) ||
                          (d.tags && d.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) ||
                          (d.keyContributions && d.keyContributions.some(contrib => 
                              contrib.toLowerCase().includes(lowerQuery)));
            
            if (matches) {
                matchingNodes.add(d.id);
            }
            
            return matches ? 1 : 0.2;
        }).classed('search-highlighted', d => {
            const matches = d.name.toLowerCase().includes(lowerQuery) ||
                          d.fullName.toLowerCase().includes(lowerQuery) ||
                          (d.description && d.description.toLowerCase().includes(lowerQuery)) ||
                          (d.tags && d.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) ||
                          (d.keyContributions && d.keyContributions.some(contrib => 
                              contrib.toLowerCase().includes(lowerQuery)));
            return matches;
        });
        
        // Fade links accordingly - show connections between matching nodes
        this.link.style('opacity', l => {
            const sourceMatch = matchingNodes.has(l.source.id);
            const targetMatch = matchingNodes.has(l.target.id);
            
            if (sourceMatch && targetMatch) return 0.8; // Both nodes match
            if (sourceMatch || targetMatch) return 0.4; // One node matches
            return 0.05; // No matches
        });
    }

    updateTheme(isLightMode) {
        // Update node labels
        this.node.selectAll('text')
            .style('fill', isLightMode ? '#1e293b' : '#e0e0e0');
        
        // Update node strokes
        this.node.selectAll('circle')
            .style('stroke', isLightMode ? '#f8fafc' : '#ffffff');
        
        // Update link colors for light mode
        this.link
            .style('stroke', d => {
                const originalColor = this.data.linkTypes[d.type].color;
                return isLightMode ? this.adjustColorForLightMode(originalColor) : originalColor;
            });
        
        // Update link labels for theme
        if (this.linkLabel) {
            this.linkLabel
                .style('fill', d => {
                    const originalColor = this.data.linkTypes[d.type].color;
                    return isLightMode ? this.adjustColorForLightMode(originalColor) : originalColor;
                });
        }
        
        // Update arrow markers
        const linkTypes = this.data.linkTypes;
        const markers = this.svg.selectAll('marker path');
        markers.style('fill', function() {
            const markerId = d3.select(this.parentNode).attr('id');
            const type = markerId.replace('arrow-', '');
            const originalColor = linkTypes[type].color;
            return isLightMode ? '#64748b' : originalColor;
        });
        
    // SVG background is handled by CSS on #graph-container
    }
    
    adjustColorForLightMode(color) {
        // Convert bright colors to darker versions for light mode
        const colorMap = {
            '#3b82f6': '#1d4ed8', // blue
            '#ef4444': '#dc2626', // red
            '#10b981': '#059669', // green
            '#f59e0b': '#d97706', // yellow
            '#8b5cf6': '#7c3aed', // purple
            '#f97316': '#ea580c', // orange
            '#06b6d4': '#0891b2', // cyan
            '#84cc16': '#65a30d', // lime
        };
        
        return colorMap[color] || '#64748b';
    }
}

export { GraphVisualization };