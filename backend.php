<?php
// backend/contact.php - Exemple de backend PHP pour gérer les contacts

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

class ContactHandler {
    private $db;
    private $emailService;
    private $smsService;
    
    public function __construct() {
        $this->db = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER,
            DB_PASS
        );
        $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    }
    
    public function handleContact($data) {
        try {
            // 1. Sauvegarder dans la base de données
            $contactId = $this->saveToDatabase($data);
            
            // 2. Envoyer les emails
            $this->sendEmails($data, $contactId);
            
            // 3. Envoyer SMS si urgent
            if ($this->isUrgent($data)) {
                $this->sendSMS($data);
            }
            
            // 4. Envoyer notification interne
            $this->sendInternalNotification($data, $contactId);
            
            // 5. Réponse de succès
            return [
                'success' => true,
                'message' => 'Contact enregistré et notifications envoyées',
                'contact_id' => $contactId,
                'notifications' => [
                    'email' => true,
                    'sms' => $this->isUrgent($data),
                    'database' => true
                ]
            ];
            
        } catch (Exception $e) {
            error_log('Contact error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Erreur lors du traitement'
            ];
        }
    }
    
    private function saveToDatabase($data) {
        $stmt = $this->db->prepare("
            INSERT INTO bisopeto_contacts 
            (name, email, phone, company, subject, message, priority, newsletter, ip_address, user_agent, page_url) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $data['name'],
            $data['email'],
            $data['phone'] ?? null,
            $data['company'] ?? null,
            $data['subject'],
            $data['message'],
            $data['priority'] ?? 'normal',
            $data['newsletter'] ?? false,
            $_SERVER['REMOTE_ADDR'],
            $_SERVER['HTTP_USER_AGENT'],
            $data['page_url'] ?? null
        ]);
        
        return $this->db->lastInsertId();
    }
    
    private function sendEmails($data, $contactId) {
        // Destinataires BISO PETO
        $recipients = [
            'contact@bisopeto.com',
            'support@bisopeto.com',
            'admin@bisopeto.com'
        ];
        
        foreach ($recipients as $recipient) {
            $subject = ($data['priority'] === 'urgent' ? '[URGENT] ' : '') . $data['subject'];
            
            $message = "
            Nouveau message BISO PETO - Contact ID: {$contactId}
            =================================================
            
            Informations client:
            -------------------
            Nom: {$data['name']}
            Email: {$data['email']}
            Téléphone: {$data['phone']}
            Entreprise: {$data['company']}
            Priorité: {$data['priority']}
            
            Message:
            --------
            {$data['message']}
            
            Métadonnées:
            ------------
            Date: " . date('Y-m-d H:i:s') . "
            IP: {$_SERVER['REMOTE_ADDR']}
            Page: {$data['page_url']}
            ";
            
            mail($recipient, $subject, $message, [
                'From' => 'noreply@bisopeto.com',
                'Reply-To' => $data['email'],
                'X-Mailer' => 'PHP/' . phpversion(),
                'X-Priority' => ($data['priority'] === 'urgent' ? '1' : '3')
            ]);
        }
    }
    
    private function sendSMS($data) {
        // Configuration SMS API
        $apiKey = SMS_API_KEY;
        $sender = 'BISOPETO';
        $recipients = ['+243852291755', '+243812345678'];
        
        $message = "Nouveau contact urgent BISO PETO: {$data['name']} - {$data['subject']}. Voir email.";
        
        foreach ($recipients as $recipient) {
            // Utiliser l'API SMS de votre choix
            $this->callSMSAPI($apiKey, $sender, $recipient, $message);
        }
    }
    
    private function isUrgent($data) {
        $urgentKeywords = ['urgence', 'urgent', 'important', 'critique', 'immédiat'];
        $text = strtolower($data['subject'] . ' ' . $data['message']);
        
        foreach ($urgentKeywords as $keyword) {
            if (strpos($text, $keyword) !== false) {
                return true;
            }
        }
        
        return ($data['priority'] ?? 'normal') === 'urgent';
    }
    
    private function sendInternalNotification($data, $contactId) {
        // Log dans un fichier ou service externe
        $logEntry = [
            'timestamp' => date('c'),
            'contact_id' => $contactId,
            'data' => $data
        ];
        
        file_put_contents(
            'logs/contacts.log',
            json_encode($logEntry) . PHP_EOL,
            FILE_APPEND
        );
    }
}

// Traitement de la requête
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $handler = new ContactHandler();
    $response = $handler->handleContact($data);
    
    echo json_encode($response);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
}
?>
