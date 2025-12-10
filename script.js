// Configuration avancée EmailJS et SMS
const APP_CONFIG = {
    EMAILJS: {
        SERVICE_ID: 'service_bisopeto',
        TEMPLATE_ID: 'template_contact',
        TEMPLATE_SMS_ID: 'template_sms_alert', // Nouveau template pour SMS
        PUBLIC_KEY: 'YOUR_PUBLIC_KEY'
    },
    SMS_API: {
        URL: 'https://api.smsprovider.com/send', // À configurer avec votre fournisseur SMS
        API_KEY: 'YOUR_SMS_API_KEY',
        SENDER_ID: 'BISOPETO',
        RECIPIENTS: ['+243852291755', '+243812345678'] // Numéros de BISO PETO
    },
    NOTIFICATION_SETTINGS: {
        SEND_SMS: true,
        SEND_EMAIL: true,
        SMS_ON_URGENT: true,
        EMAIL_ON_NORMAL: true,
        URGENT_KEYWORDS: ['urgence', 'urgent', 'important', 'critique', 'immédiat']
    }
};

// Destinataires BISO PETO
const BISO_PETO_CONTACTS = {
    EMAILS: [
        'contact@bisopeto.com',
        'support@kin-ecomap.com',
        'admin@bisopeto.com'
    ],
    PHONES: [
        '+243852291755',
        '+243812345678'
    ],
    TEAM_MEMBERS: [
        { name: 'Direction', email: 'direction@bisopeto.com', phone: '+243852291755' },
        { name: 'Support Technique', email: 'support@bisopeto.com', phone: '+243812345678' },
        { name: 'Commercial', email: 'commercial@bisopeto.com', phone: '+243899999999' }
    ]
};

// Initialisation
document.addEventListener('DOMContentLoaded', function () {
    // Initialiser EmailJS
    if (typeof emailjs !== 'undefined') {
        emailjs.init(APP_CONFIG.EMAILJS.PUBLIC_KEY);
        console.log('EmailJS initialisé');
    } else {
        console.error('EmailJS non chargé');
    }

    // Initialiser les composants
    initMobileMenu();
    initSmoothScroll();
    initEnhancedContactForm(); // Form amélioré
    initBackToTop();
    initNewsletter();
    initAnimations();
    initNotificationPreferences();
});

// Formulaire de contact amélioré
function initEnhancedContactForm() {
    const contactForm = document.getElementById('contactForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const spinner = document.getElementById('spinner');
    const formAlert = document.getElementById('formAlert');

    if (!contactForm) return;

    // Ajouter champ priorité
    addPriorityField();

    // Validation améliorée
    const inputs = contactForm.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });

    // Soumission du formulaire amélioré
    contactForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Désactiver le bouton et afficher le spinner
        setSubmitState(true, 'Envoi en cours...');

        try {
            // Préparer les données du formulaire
            const formData = getEnhancedFormData();
            
            // Déterminer la priorité
            const isUrgent = checkUrgency(formData);
            
            // Envoi multiple
            const results = await sendMultiChannelNotification(formData, isUrgent);
            
            // Succès
            showAlert('Message envoyé avec succès ! Notre équipe vous répondra rapidement.', 'success');
            contactForm.reset();
            
            // Log pour suivi
            logContact(formData, results);
            
            // Confirmation à l'utilisateur
            sendUserConfirmation(formData);
            
        } catch (error) {
            console.error('Erreur d\'envoi:', error);
            showAlert('Une erreur est survenue. Veuillez réessayer ou nous contacter directement.', 'error');
            
            // Fallback amélioré
            setTimeout(() => {
                const fallbackSent = sendEnhancedFallback();
                if (fallbackSent) {
                    showAlert('Redirection vers votre client email...', 'warning');
                }
            }, 3000);
            
        } finally {
            // Réactiver le bouton
            setSubmitState(false, 'Envoyer le message');
        }
    });

    // Fonctions améliorées
    function addPriorityField() {
        const subjectGroup = contactForm.querySelector('#subject').closest('.form-group');
        const priorityHtml = `
            <div class="form-group">
                <label for="priority">Priorité</label>
                <div class="priority-selector">
                    <div class="priority-options">
                        <label class="priority-option">
                            <input type="radio" name="priority" value="normal" checked>
                            <span class="priority-label normal">
                                <i class="fas fa-clock"></i> Normal
                            </span>
                        </label>
                        <label class="priority-option">
                            <input type="radio" name="priority" value="urgent">
                            <span class="priority-label urgent">
                                <i class="fas fa-exclamation-triangle"></i> Urgent
                            </span>
                        </label>
                    </div>
                </div>
            </div>
        `;
        subjectGroup.insertAdjacentHTML('afterend', priorityHtml);
    }

    function getEnhancedFormData() {
        const priority = contactForm.querySelector('input[name="priority"]:checked')?.value || 'normal';
        
        return {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value || 'Non fourni',
            company: document.getElementById('company').value || 'Particulier',
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value,
            priority: priority,
            newsletter: document.getElementById('newsletter').checked ? 'Oui' : 'Non',
            date: new Date().toLocaleString('fr-FR'),
            time: new Date().toLocaleTimeString('fr-FR'),
            page: window.location.href,
            userAgent: navigator.userAgent,
            ip: 'En attente' // À implémenter avec un service backend
        };
    }

    function checkUrgency(formData) {
        const urgentKeywords = APP_CONFIG.NOTIFICATION_SETTINGS.URGENT_KEYWORDS;
        const text = (formData.subject + ' ' + formData.message).toLowerCase();
        
        return urgentKeywords.some(keyword => text.includes(keyword)) || 
               formData.priority === 'urgent';
    }

    async function sendMultiChannelNotification(formData, isUrgent) {
        const results = {
            email: false,
            sms: false,
            internal: false
        };

        try {
            // 1. Envoi Email principal
            if (APP_CONFIG.NOTIFICATION_SETTINGS.SEND_EMAIL) {
                results.email = await sendToBisoPetoEmail(formData, isUrgent);
            }

            // 2. Envoi SMS si urgent
            if (isUrgent && APP_CONFIG.NOTIFICATION_SETTINGS.SEND_SMS) {
                results.sms = await sendToBisoPetoSMS(formData);
            }

            // 3. Notification interne
            results.internal = await sendInternalNotification(formData);

            return results;
            
        } catch (error) {
            console.error('Erreur dans l\'envoi multi-canaux:', error);
            throw error;
        }
    }

    async function sendToBisoPetoEmail(formData, isUrgent) {
        // Envoi à tous les emails BISO PETO
        const emailPromises = BISO_PETO_CONTACTS.EMAILS.map(async (email) => {
            try {
                await emailjs.send(
                    APP_CONFIG.EMAILJS.SERVICE_ID,
                    APP_CONFIG.EMAILJS.TEMPLATE_ID,
                    {
                        to_email: email,
                        to_name: 'Équipe BISO PETO',
                        from_name: formData.name,
                        from_email: formData.email,
                        phone: formData.phone,
                        company: formData.company,
                        subject: `${isUrgent ? '🔴 URGENT - ' : ''}${formData.subject}`,
                        message: formData.message,
                        priority: formData.priority,
                        newsletter: formData.newsletter,
                        date: formData.date,
                        time: formData.time,
                        page_url: formData.page
                    }
                );
                return true;
            } catch (error) {
                console.error(`Erreur d'envoi à ${email}:`, error);
                return false;
            }
        });

        const results = await Promise.allSettled(emailPromises);
        return results.some(result => result.value === true);
    }

    async function sendToBisoPetoSMS(formData) {
        // Format du message SMS
        const smsMessage = `Nouveau message BISO PETO:
De: ${formData.name}
Tel: ${formData.phone}
Sujet: ${formData.subject}
Message: ${formData.message.substring(0, 100)}${formData.message.length > 100 ? '...' : ''}
Date: ${formData.date}`;

        // Envoi à tous les numéros BISO PETO
        const smsPromises = BISO_PETO_CONTACTS.PHONES.map(async (phone) => {
            try {
                const response = await fetch(APP_CONFIG.SMS_API.URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${APP_CONFIG.SMS_API.API_KEY}`
                    },
                    body: JSON.stringify({
                        to: phone,
                        from: APP_CONFIG.SMS_API.SENDER_ID,
                        message: smsMessage,
                        urgent: true
                    })
                });

                if (!response.ok) {
                    throw new Error(`SMS API error: ${response.status}`);
                }

                return true;
            } catch (error) {
                console.error(`Erreur SMS à ${phone}:`, error);
                return false;
            }
        });

        const results = await Promise.allSettled(smsPromises);
        return results.some(result => result.value === true);
    }

    async function sendInternalNotification(formData) {
        // Créer une notification interne dans la console
        console.group('📨 Nouveau message BISO PETO');
        console.log('👤 Nom:', formData.name);
        console.log('📧 Email:', formData.email);
        console.log('📞 Téléphone:', formData.phone);
        console.log('🏢 Entreprise:', formData.company);
        console.log('📋 Sujet:', formData.subject);
        console.log('⚠️ Priorité:', formData.priority);
        console.log('📝 Message:', formData.message);
        console.log('📅 Date:', formData.date);
        console.groupEnd();

        // Ici, vous pourriez ajouter un envoi à votre base de données
        // ou à un service de notification interne
        return true;
    }

    function sendUserConfirmation(formData) {
        // Envoyer une confirmation à l'utilisateur
        setTimeout(() => {
            const confirmationMessage = `
Bonjour ${formData.name},

Nous avons bien reçu votre message concernant "${formData.subject}".
Notre équipe BISO PETO l'a reçu par email et SMS (si urgent).
Nous vous répondrons dans les plus brefs délais.

Cordialement,
L'équipe BISO PETO - KIN ECO-MAP
            `;
            
            // Afficher un toast de confirmation
            showToast('Un email de confirmation vous a été envoyé.', 'success');
            
            // Optionnel: Envoyer un email de confirmation automatique
            // sendConfirmationEmail(formData);
        }, 1000);
    }

    function logContact(formData, results) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            formData: formData,
            results: results,
            location: window.location.href
        };
        
        // Sauvegarder dans localStorage pour historique
        const logs = JSON.parse(localStorage.getItem('bisopeto_contact_logs') || '[]');
        logs.unshift(logEntry);
        if (logs.length > 50) logs.pop(); // Garder seulement les 50 derniers
        localStorage.setItem('bisopeto_contact_logs', JSON.stringify(logs));
        
        // Envoyer à un service de tracking si nécessaire
        if (typeof gtag !== 'undefined') {
            gtag('event', 'contact_form_submit', {
                'event_category': 'engagement',
                'event_label': formData.subject,
                'value': formData.priority === 'urgent' ? 2 : 1
            });
        }
    }

    function sendEnhancedFallback() {
        const email = BISO_PETO_CONTACTS.EMAILS[0];
        const subject = encodeURIComponent(document.getElementById('subject').value || 'Contact depuis le site BISO PETO');
        const priority = document.querySelector('input[name="priority"]:checked')?.value || 'normal';
        
        const body = encodeURIComponent(
            `🔔 NOUVEAU MESSAGE BISO PETO 🔔

INFORMATIONS CLIENT:
───────────────
👤 Nom: ${document.getElementById('name').value}
📧 Email: ${document.getElementById('email').value}
📞 Téléphone: ${document.getElementById('phone').value || 'Non fourni'}
🏢 Entreprise: ${document.getElementById('company').value || 'Particulier'}
⚠️ Priorité: ${priority === 'urgent' ? '🔴 URGENT' : '🟢 Normal'}

MESSAGE:
────────
${document.getElementById('message').value}

MÉTADONNÉES:
────────────
📅 Date: ${new Date().toLocaleString('fr-FR')}
🌐 Page: ${window.location.href}
📱 Navigateur: ${navigator.userAgent}
            `
        );

        const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`;
        
        // Ouvrir le client email
        window.open(mailtoLink, '_blank');
        return true;
    }

    // Gestion améliorée des alertes
    function showAlert(message, type = 'info') {
        if (!formAlert) return;

        formAlert.innerHTML = '';
        formAlert.textContent = message;
        formAlert.className = 'contact-alert ' + type;
        formAlert.style.display = 'flex';

        // Ajouter une icône
        const icon = document.createElement('i');
        icon.className = getAlertIcon(type);
        formAlert.prepend(icon);

        // Ajouter un bouton de fermeture
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.className = 'alert-close';
        closeBtn.onclick = () => formAlert.style.display = 'none';
        formAlert.appendChild(closeBtn);

        // Auto-hide après 15 secondes pour les urgents, 10 pour les autres
        const hideTime = type === 'warning' ? 15000 : 10000;
        setTimeout(() => {
            formAlert.style.display = 'none';
        }, hideTime);

        // Scroll vers l'alerte
        formAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Préférences de notification
function initNotificationPreferences() {
    const notificationPrefs = localStorage.getItem('bisopeto_notification_prefs');
    
    if (!notificationPrefs) {
        // Définir les préférences par défaut
        const defaultPrefs = {
            emailNotifications: true,
            smsNotifications: true,
            marketingEmails: false,
            frequency: 'realtime'
        };
        localStorage.setItem('bisopeto_notification_prefs', JSON.stringify(defaultPrefs));
    }
}

// Dashboard de suivi (accessible aux administrateurs)
function initContactDashboard() {
    // Cette fonction serait appelée sur une page admin
    const logs = JSON.parse(localStorage.getItem('bisopeto_contact_logs') || '[]');
    
    console.group('📊 Dashboard Contacts BISO PETO');
    console.log(`Total des messages: ${logs.length}`);
    
    const urgentCount = logs.filter(log => log.formData.priority === 'urgent').length;
    console.log(`Messages urgents: ${urgentCount}`);
    
    const today = new Date().toDateString();
    const todayCount = logs.filter(log => 
        new Date(log.timestamp).toDateString() === today
    ).length;
    console.log(`Messages aujourd'hui: ${todayCount}`);
    
    console.groupEnd();
}

// Fonction pour tester le système
function testNotificationSystem() {
    const testData = {
        name: 'Test Utilisateur',
        email: 'test@example.com',
        phone: '+243000000000',
        company: 'Test Company',
        subject: 'Test de notification',
        message: 'Ceci est un test du système de notification BISO PETO',
        priority: 'normal'
    };
    
    console.log('🧪 Test du système de notification BISO PETO...');
    sendMultiChannelNotification(testData, false)
        .then(results => {
            console.log('✅ Test réussi:', results);
            showToast('Système de notification testé avec succès', 'success');
        })
        .catch(error => {
            console.error('❌ Test échoué:', error);
            showToast('Erreur lors du test du système', 'error');
        });
}

// Gestionnaire d'erreurs amélioré
window.addEventListener('error', function (e) {
    console.error('Erreur globale BISO PETO:', e.error);
    
    // Envoyer l'erreur à votre service de tracking
    if (typeof gtag !== 'undefined') {
        gtag('event', 'exception', {
            'description': e.error.message,
            'fatal': false
        });
    }
});

// Exporter les fonctions pour debug
window.BISO_PETO = {
    testNotificationSystem,
    initContactDashboard,
    getConfig: () => APP_CONFIG,
    getContacts: () => BISO_PETO_CONTACTS
};
