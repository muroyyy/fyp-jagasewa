<?php
/**
 * Landlord Model
 * Handles landlord-specific operations
 */

class Landlord {
    private $conn;
    private $table_name = "landlords";

    // Landlord properties
    public $landlord_id;
    public $user_id;
    public $full_name;
    public $phone;
    public $company_name;
    public $address;
    public $profile_image;
    public $created_at;
    public $updated_at;

    /**
     * Constructor
     */
    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Create landlord profile
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                SET user_id = :user_id,
                    full_name = :full_name,
                    phone = :phone,
                    company_name = :company_name,
                    address = :address";

        $stmt = $this->conn->prepare($query);

        // Sanitize inputs
        $this->full_name = htmlspecialchars(strip_tags($this->full_name));
        $this->phone = htmlspecialchars(strip_tags($this->phone));
        $this->company_name = htmlspecialchars(strip_tags($this->company_name));
        $this->address = htmlspecialchars(strip_tags($this->address));

        // Bind values
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":full_name", $this->full_name);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":company_name", $this->company_name);
        $stmt->bindParam(":address", $this->address);

        if($stmt->execute()) {
            $this->landlord_id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    /**
     * Get landlord by user ID
     */
    public function getByUserId($user_id) {
        $query = "SELECT l.*, u.email, u.is_verified
                FROM " . $this->table_name . " l
                INNER JOIN users u ON l.user_id = u.user_id
                WHERE l.user_id = :user_id
                LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }

        return false;
    }

    /**
     * Get landlord by ID
     */
    public function getById($landlord_id) {
        $query = "SELECT l.*, u.email, u.is_verified
                FROM " . $this->table_name . " l
                INNER JOIN users u ON l.user_id = u.user_id
                WHERE l.landlord_id = :landlord_id
                LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":landlord_id", $landlord_id);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }

        return false;
    }

    /**
     * Update landlord profile
     */
    public function update() {
        $query = "UPDATE " . $this->table_name . "
                SET full_name = :full_name,
                    phone = :phone,
                    company_name = :company_name,
                    address = :address,
                    profile_image = :profile_image
                WHERE landlord_id = :landlord_id";

        $stmt = $this->conn->prepare($query);

        // Sanitize inputs
        $this->full_name = htmlspecialchars(strip_tags($this->full_name));
        $this->phone = htmlspecialchars(strip_tags($this->phone));
        $this->company_name = htmlspecialchars(strip_tags($this->company_name));
        $this->address = htmlspecialchars(strip_tags($this->address));
        $this->profile_image = htmlspecialchars(strip_tags($this->profile_image));

        // Bind values
        $stmt->bindParam(":full_name", $this->full_name);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":company_name", $this->company_name);
        $stmt->bindParam(":address", $this->address);
        $stmt->bindParam(":profile_image", $this->profile_image);
        $stmt->bindParam(":landlord_id", $this->landlord_id);

        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    /**
     * Delete landlord profile
     */
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . "
                WHERE landlord_id = :landlord_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":landlord_id", $this->landlord_id);

        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    /**
     * Get all landlords
     */
    public function getAll($limit = 10, $offset = 0) {
        $query = "SELECT l.*, u.email, u.is_verified, u.created_at
                FROM " . $this->table_name . " l
                INNER JOIN users u ON l.user_id = u.user_id
                WHERE u.is_active = TRUE
                ORDER BY l.created_at DESC
                LIMIT :limit OFFSET :offset";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":limit", $limit, PDO::PARAM_INT);
        $stmt->bindParam(":offset", $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Count total landlords
     */
    public function countAll() {
        $query = "SELECT COUNT(*) as total
                FROM " . $this->table_name . " l
                INNER JOIN users u ON l.user_id = u.user_id
                WHERE u.is_active = TRUE";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['total'];
    }

    public function getLandlordByUserId($userId) {
    $query = "SELECT 
                l.landlord_id,
                l.full_name,
                l.phone,
                l.company_name,
                u.email,
                u.user_role
              FROM landlords l
              INNER JOIN users u ON l.user_id = u.user_id
              WHERE l.user_id = :user_id
              LIMIT 1";
    
    $stmt = $this->conn->prepare($query);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();
    
    return $stmt->fetch(PDO::FETCH_ASSOC);
}
}
?>