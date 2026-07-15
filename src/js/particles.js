// src/js/particles.js
(function() {
    let particlesContainer;
    const MIN_WIDTH = 969;
    const MAX_PARTICLES = 60; 

    function getParticleColor() {
        const theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'dark') {
            return ['#ffffff', '#a855f7', '#d8b4fe']; 
        }
        return ['#333333', '#a855f7', '#777777'];
    }

    async function initParticles() {
        if (typeof tsParticles === 'undefined') {
            console.warn("tsParticles library not loaded");
            return;
        }

        if (particlesContainer) return;

        try {
            const particleColor = getParticleColor();

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
                            value: { min: 1, max: 3 }, 
                            animation: {
                                enable: true,
                                speed: 0.5,
                                minimumValue: 0.5,
                                sync: false,
                            },
                        },
                        opacity: {
                            value: { min: 0.1, max: 0.4 }, 
                            animation: {
                                enable: true,
                                speed: 0.2,
                                minimumValue: 0.05,
                                sync: false,
                            },
                        },
                        move: {
                            direction: "top", 
                            enable: true,
                            outModes: { default: "out" },
                            random: true,
                            speed: 0.3, 
                            straight: false,
                        },
                        number: {
                            density: { enable: true, area: 800 },
                            value: 40,
                            limit: MAX_PARTICLES,
                        },
                        links: {
                            enable: false, 
                        },
                    },
                    background: {
                        color: "transparent",
                    },
                    interactivity: {
                        events: {
                            onHover: {
                                enable: true,
                                mode: "bubble", 
                            },
                            resize: true,
                        },
                        modes: {
                            bubble: {
                                distance: 200,
                                size: 4,
                                duration: 2,
                                opacity: 0.8,
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

    const themeObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'data-theme') {
                reloadParticles();
            }
        });
    });

    const htmlElement = document.documentElement;
    themeObserver.observe(htmlElement, { attributes: true });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', handleParticlesState);
    } else {
        handleParticlesState();
    }

    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            handleParticlesState();
        }, 300);
    });
})();