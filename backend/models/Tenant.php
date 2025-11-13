<?php
/**
 * Tenant Model
 * Handles tenant-specific operations
 */

class Tenant {
    private $conn;
    private $table_name = "tenants";

    // Tenant properties
    public $tenant_id;
    public $user_id;
    public $property_id;
    public $move_in_date;
    public $full_name;
    public $phone;
    public $ic_number;
    public $date_of_birth;
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
     * Create tenant profile
     */
    public function create() {
        $query = "INSERT INTO " . $this->table_name . "
                SET user_id = :user_id,
                    property_id = :property_id,
                    move_in_date = :move_in_date,
                    full_name = :full_name,
                    phone = :phone,
                    ic_number = :ic_number,
                    date_of_birth = :date_of_birth";

        $stmt = $this->conn->prepare($query);

        // Sanitize inputs
        $this->full_name = htmlspecialchars(strip_tags($this->full_name));
        $this->phone = htmlspecialchars(strip_tags($this->phone));
        $this->ic_number = htmlspecialchars(strip_tags($this->ic_number));

        // Bind values
        $stmt->bindParam(":user_id", $this->user_id);
        $stmt->bindParam(":property_id", $this->property_id);
        $stmt->bindParam(":move_in_date", $this->move_in_date);
        $stmt->bindParam(":full_name", $this->full_name);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":ic_number", $this->ic_number);
        $stmt->bindParam(":date_of_birth", $this->date_of_birth);

        if($stmt->execute()) {
            $this->tenant_id = $this->conn->lastInsertId();
            return true;
        }

        return false;
    }

    /**
     * Get tenant by user ID
     */
    public function getByUserId($user_id) {
        $query = "SELECT t.*, u.email, u.is_verified
                FROM " . $this->table_name . " t
                INNER JOIN users u ON t.user_id = u.user_id
                WHERE t.user_id = :user_id
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
     * Get tenant by ID
     */
    public function getById($tenant_id) {
        $query = "SELECT t.*, u.email, u.is_verified
                FROM " . $this->table_name . " t
                INNER JOIN users u ON t.user_id = u.user_id
                WHERE t.tenant_id = :tenant_id
                LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":tenant_id", $tenant_id);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }

        return false;
    }

    /**
     * Update tenant profile
     */
    public function update() {
        $query = "UPDATE " . $this->table_name . "
                SET full_name = :full_name,
                    phone = :phone,
                    ic_number = :ic_number,
                    date_of_birth = :date_of_birth,
                    profile_image = :profile_image
                WHERE tenant_id = :tenant_id";

        $stmt = $this->conn->prepare($query);

        // Sanitize inputs
        $this->full_name = htmlspecialchars(strip_tags($this->full_name));
        $this->phone = htmlspecialchars(strip_tags($this->phone));
        $this->ic_number = htmlspecialchars(strip_tags($this->ic_number));
        $this->profile_image = htmlspecialchars(strip_tags($this->profile_image));

        // Bind values
        $stmt->bindParam(":full_name", $this->full_name);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":ic_number", $this->ic_number);
        $stmt->bindParam(":date_of_birth", $this->date_of_birth);
        $stmt->bindParam(":profile_image", $this->profile_image);
        $stmt->bindParam(":tenant_id", $this->tenant_id);

        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    /**
     * Delete tenant profile
     */
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . "
                WHERE tenant_id = :tenant_id";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":tenant_id", $this->tenant_id);

        if($stmt->execute()) {
            return true;
        }

        return false;
    }

    /**
     * Get all tenants
     */
    public function getAll($limit = 10, $offset = 0) {
        $query = "SELECT t.*, u.email, u.is_verified, u.created_at
                FROM " . $this->table_name . " t
                INNER JOIN users u ON t.user_id = u.user_id
                WHERE u.is_active = TRUE
                ORDER BY t.created_at DESC
                LIMIT :limit OFFSET :offset";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":limit", $limit, PDO::PARAM_INT);
        $stmt->bindParam(":offset", $offset, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Count total tenants
     */
    public function countAll() {
        $query = "SELECT COUNT(*) as total
                FROM " . $this->table_name . " t
                INNER JOIN users u ON t.user_id = u.user_id
                WHERE u.is_active = TRUE";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row['total'];
    }

    /**
     * Check if IC number exists
     */
    public function icNumberExists() {
        $query = "SELECT tenant_id FROM " . $this->table_name . "
                WHERE ic_number = :ic_number LIMIT 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":ic_number", $this->ic_number);
        $stmt->execute();

        return $stmt->rowCount() > 0;
    }
}
?>