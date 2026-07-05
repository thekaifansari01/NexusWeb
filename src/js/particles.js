(function() {
    let particlesContainer;
    const MIN_WIDTH = 969;
    const MAX_PARTICLES = 120; // Maximum allowed particles

    function getParticleColor() {
        const theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'dark') {
            return ['#ffffff', '#dddddd', '#bbbbbb', '#999999'];
        }
        return ['#333333', '#555555', '#777777', '#999999'];
    }

    function getLinkColor() {
        const theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'dark') {
            return 'rgba(255,255,255,0.15)';
        }
        return 'rgba(0,0,0,0.15)';
    }

    function getGrabColor() {
        const theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'dark') {
            return '#ffffff';
        }
        return '#333333';
    }

    async function initParticles() {
        if (typeof tsParticles === 'undefined') {
            console.warn("tsParticles library not loaded");
            return;
        }

        // If already initialized, do nothing
        if (particlesContainer) return;

        try {
            const particleColor = getParticleColor();
            const linkColor = getLinkColor();
            const grabColor = getGrabColor();

            particlesContainer = await tsParticles.load({
                id: "tsparticles",
                options: {
                    fpsLimit: 30,
                    particles: {
                        color: {
                            value: particleColor,
                        },
                        shape: {
                            type: "circle",
                        },
                        size: {
                            value: { min: 1.5, max: 4.5 },
                            animation: {
                                enable: true,
                                speed: 0.8,
                                minimumValue: 0.5,
                                sync: false,
                            },
                        },
                        opacity: {
                            value: { min: 0.2, max: 0.7 },
                            animation: {
                                enable: true,
                                speed: 0.3,
                                minimumValue: 0.1,
                                sync: false,
                            },
                        },
                        move: {
                            direction: "none",
                            enable: true,
                            outModes: { default: "bounce" },
                            random: false,
                            speed: 0.8,
                            straight: false,
                            attract: {
                                enable: true,
                                rotateX: 600,
                                rotateY: 800,
                            },
                        },
                        number: {
                            density: { enable: true, area: 800 },
                            value: 50,
                            limit: MAX_PARTICLES, // Cap the total number of particles
                        },
                        links: {
                            color: { value: linkColor },
                            distance: 150,
                            enable: true,
                            opacity: 0.25,
                            width: 0.8,
                        },
                        twinkle: {
                            particles: {
                                enable: true,
                                frequency: 0.04,
                                opacity: 0.6,
                            },
                        },
                    },
                    background: {
                        color: "transparent",
                    },
                    interactivity: {
                        events: {
                            onHover: {
                                enable: true,
                                mode: "grab",
                                parallax: {
                                    enable: true,
                                    force: 30,
                                    smooth: 5,
                                },
                            },
                            onClick: {
                                enable: true,
                                mode: "push",
                            },
                            resize: true,
                        },
                        modes: {
                            grab: {
                                distance: 160,
                                links: {
                                    opacity: 0.5,
                                    color: grabColor,
                                },
                            },
                            push: {
                                quantity: 1, // Reduced from 3 to 1 to slow particle growth
                            },
                        },
                    },
                    detectRetina: true,
                },
            });
        } catch (error) {
            console.error("tsParticles initialization error:", error);
            particlesContainer = undefined;
        }
    }

    function destroyParticles() {
        if (particlesContainer) {
            try {
                particlesContainer.destroy();
            } catch (e) {
                console.warn("Error destroying particles:", e);
            }
            particlesContainer = undefined;
        }
    }

    function handleParticlesState() {
        if (window.innerWidth >= MIN_WIDTH) {
            initParticles();
        } else {
            destroyParticles();
        }
    }

    function reloadParticles() {
        if (window.innerWidth >= MIN_WIDTH) {
            destroyParticles();
            setTimeout(initParticles, 200);
        }
    }

    // Watch for theme changes to reload particles with new colors
    const themeObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'data-theme') {
                reloadParticles();
            }
        });
    });

    const htmlElement = document.documentElement;
    themeObserver.observe(htmlElement, { attributes: true });

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', handleParticlesState);
    } else {
        handleParticlesState();
    }

    // Debounced resize handler to avoid frequent re-initialization
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            handleParticlesState();
        }, 300);
    });
})();