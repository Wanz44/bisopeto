a// Configuration EmailJS
const EMAILJS_CONFIG = {
    SERVICE_ID: 'service_bisopeto', // À remplacer avec votre Service ID
    TEMPLATE_ID: 'template_contact', // À remplacer avec votre Template ID
    PUBLIC_KEY: 'YOUR_PUBLIC_KEY' // À remplacer avec votre Public Key
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser EmailJS
    if (typeof emailjs !== 'undefined') {
        emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
        console.log('EmailJS initialisé');
    } else {
        console.error('EmailJS non chargé');
    }
    
    // Initialiser les composants
    initMobileMenu();
    initSmoothScroll();
    initContactForm();
    initBackToTop();
    initNewsletter();
    initAnimations();
});

// Menu mobile
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            this.setAttribute('aria-expanded', navLinks.classList.contains('active'));
        });
        
        // Fermer le menu au clic sur les liens
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
            });
        });
        
        // Fermer le menu en cliquant à l'extérieur
        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                navLinks.classList.remove('active');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }
}

// Scroll fluide
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            
            if (href === '#' || href === '#!') return;
            
            e.preventDefault();
            
            const targetElement = document.querySelector(href);
            if (targetElement) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Formulaire de contact
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const spinner = document.getElementById('spinner');
    const formAlert = document.getElementById('formAlert');
    
    if (!contactForm) return;
    
    // Validation en temps réel
    const inputs = contactForm.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
    
    // Soumission du formulaire
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        // Désactiver le bouton et afficher le spinner
        setSubmitState(true, 'Envoi en cours...');
        
        try {
            // Préparer les données du formulaire
            const formData = getFormData();
            
            // Option 1: Envoi via EmailJS (recommandé)
            if (typeof emailjs !== 'undefined') {
                await sendEmailWithEmailJS(formData);
            } 
            // Option 2: Envoi via Fetch API (backend personnalisé)
            else {
                await sendEmailWithFetch(formData);
            }
            
            // Succès
            showAlert('Message envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.', 'success');
            contactForm.reset();
            
        } catch (error) {
            console.error('Erreur d\'envoi:', error);
            showAlert('Une erreur est survenue lors de l\'envoi. Veuillez réessayer ou nous contacter directement.', 'error');
            
            // Fallback: Redirection vers mailto
            setTimeout(() => {
                const fallbackSent = sendEmailFallback();
                if (fallbackSent) {
                    showAlert('Redirection vers votre client email...', 'warning');
                }
            }, 3000);
            
        } finally {
            // Réactiver le bouton
            setSubmitState(false, 'Envoyer le message');
        }
    });
    
    // Fonctions de validation
    function validateField(e) {
        const field = e.target;
        const errorElement = document.getElementById(field.id + 'Error');
        
        if (!field.checkValidity()) {
            showFieldError(field, errorElement, getErrorMessage(field));
            return false;
        }
        
        clearFieldError(field, errorElement);
        return true;
    }
    
    function validateForm() {
        let isValid = true;
        const requiredFields = contactForm.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            const errorElement = document.getElementById(field.id + 'Error');
            
            if (!field.value.trim()) {
                showFieldError(field, errorElement, 'Ce champ est obligatoire');
                isValid = false;
            } else if (!validateFieldType(field)) {
                showFieldError(field, errorElement, getErrorMessage(field));
                isValid = false;
            } else {
                clearFieldError(field, errorElement);
            }
        });
        
        return isValid;
    }
    
    function validateFieldType(field) {
        if (field.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(field.value);
        }
        
        if (field.id === 'phone') {
            const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,20}$/;
            return !field.value || phoneRegex.test(field.value);
        }
        
        return true;
    }
    
    function getErrorMessage(field) {
        if (field.type === 'email') return 'Veuillez entrer une adresse email valide';
        if (field.id === 'phone') return 'Format de téléphone invalide';
        if (field.value.length < 2) return 'Ce champ doit contenir au moins 2 caractères';
        return 'Valeur invalide';
    }
    
    function showFieldError(field, errorElement, message) {
        field.style.borderColor = 'var(--error)';
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }
    
    function clearFieldError(e) {
        const field = e.target || e;
        const errorElement = document.getElementById(field.id + 'Error');
        
        field.style.borderColor = '';
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }
    
    // Gestion de l'état du bouton
    function setSubmitState(isLoading, text) {
        if (submitBtn) {
            submitBtn.disabled = isLoading;
            if (btnText) btnText.textContent = text;
            if (spinner) {
                spinner.classList.toggle('active', isLoading);
                spinner.style.display = isLoading ? 'block' : 'none';
            }
        }
    }
    
    // Récupération des données du formulaire
    function getFormData() {
        return {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value || 'Non fourni',
            company: document.getElementById('company').value || 'Non fourni',
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value,
            newsletter: document.getElementById('newsletter').checked ? 'Oui' : 'Non',
            date: new Date().toLocaleString('fr-FR'),
            page: window.location.href
        };
    }
    
    // Envoi via EmailJS
    async function sendEmailWithEmailJS(formData) {
        if (!EMAILJS_CONFIG.SERVICE_ID || !EMAILJS_CONFIG.TEMPLATE_ID) {
            throw new Error('EmailJS non configuré');
        }
        
        const response = await emailjs.send(
            EMAILJS_CONFIG.SERVICE_ID,
            EMAILJS_CONFIG.TEMPLATE_ID,
            {
                to_name: 'BISO PETO Support',
                from_name: formData.name,
                from_email: formData.email,
                phone: formData.phone,
                company: formData.company,
                subject: formData.subject,
                message: formData.message,
                newsletter: formData.newsletter,
                date: formData.date,
                page_url: formData.page
            }
        );
        
        return response;
    }
    
    // Envoi via Fetch API (backend personnalisé)
    async function sendEmailWithFetch(formData) {
        // Remplacez cette URL par votre endpoint backend
        const endpoint = 'https://votre-backend.com/api/contact';
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        return await response.json();
    }
    
    // Fallback mailto
    function sendEmailFallback() {
        const email = 'contact@bisopeto.com';
        const subject = encodeURIComponent(document.getElementById('subject').value || 'Contact depuis le site');
        const body = encodeURIComponent(
            `Nom: ${document.getElementById('name').value}\n` +
            `Email: ${document.getElementById('email').value}\n` +
            `Téléphone: ${document.getElementById('phone').value || 'Non fourni'}\n` +
            `Entreprise: ${document.getElementById('company').value || 'Non fourni'}\n\n` +
            `Message:\n${document.getElementById('message').value}`
        );
        
        const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`;
        
        // Ouvrir le client email
        window.location.href = mailtoLink;
        return true;
    }
    
    // Affichage des alertes
    function showAlert(message, type = 'info') {
        if (!formAlert) return;
        
        formAlert.textContent = message;
        formAlert.className = 'contact-alert ' + type;
        formAlert.style.display = 'flex';
        
        // Ajouter une icône
        const icon = document.createElement('i');
        icon.className = getAlertIcon(type);
        formAlert.prepend(icon);
        
        // Auto-hide après 10 secondes
        setTimeout(() => {
            formAlert.style.display = 'none';
        }, 10000);
        
        // Scroll vers l'alerte
        formAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    function getAlertIcon(type) {
        switch(type) {
            case 'success': return 'fas fa-check-circle';
            case 'error': return 'fas fa-exclamation-circle';
            case 'warning': return 'fas fa-exclamation-triangle';
            default: return 'fas fa-info-circle';
        }
    }
}

// Back to Top
function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    
    if (backToTopBtn) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });
        
        backToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Newsletter
function initNewsletter() {
    const newsletterBtn = document.getElementById('newsletterBtn');
    const newsletterEmail = document.getElementById('newsletterEmail');
    
    if (newsletterBtn && newsletterEmail) {
        newsletterBtn.addEventListener('click', function() {
            const email = newsletterEmail.value.trim();
            
            if (!validateEmail(email)) {
                showToast('Veuillez entrer une adresse email valide', 'error');
                return;
            }
            
            // Simuler l'envoi
            newsletterBtn.disabled = true;
            newsletterBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            setTimeout(() => {
                showToast('Merci pour votre inscription à la newsletter !', 'success');
                newsletterEmail.value = '';
                newsletterBtn.disabled = false;
                newsletterBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
            }, 1500);
        });
        
        // Entrée pour soumettre
        newsletterEmail.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                newsletterBtn.click();
            }
        });
    }
    
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
}

// Animations
function initAnimations() {
    // Animation d'apparition des éléments au scroll
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, observerOptions);
    
    // Observer les éléments à animer
    document.querySelectorAll('.module-card, .objective-card, .contact-card').forEach(el => {
        observer.observe(el);
    });
    
    // Animation au chargement
    document.querySelectorAll('[data-aos]').forEach(el => {
        observer.observe(el);
    });
}

// Toasts
function showToast(message, type = 'info') {
    // Créer le toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${getToastIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Ajouter au body
    document.body.appendChild(toast);
    
    // Animation d'entrée
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Supprimer après 5 secondes
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 5000);
}

function getToastIcon(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

// Gestion des erreurs globales
window.addEventListener('error', function(e) {
    console.error('Erreur globale:', e.error);
    // Vous pouvez envoyer ces erreurs à votre service de tracking
});

// Performance monitoring
window.addEventListener('load', function() {
    // Envoyer les métriques de performance si nécessaire
    const loadTime = window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart;
    console.log(`Temps de chargement: ${loadTime}ms`);
    
    // Lazy loading pour les images
    if ('IntersectionObserver' in window) {
        const lazyImages = document.querySelectorAll('img[loading="lazy"]');
        
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        lazyImages.forEach(img => imageObserver.observe(img));
    }
});

// API de géolocalisation (optionnelle)
if (navigator.geolocation) {
    // Vous pouvez utiliser la géolocalisation pour des fonctionnalités avancées
    console.log('Géolocalisation disponible');
}

// Service Worker pour PWA (optionnel)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(function(registration) {
            console.log('ServiceWorker enregistré avec succès:', registration.scope);
        }).catch(function(error) {
            console.log('Échec d\'enregistrement du ServiceWorker:', error);
        });
    });
}
