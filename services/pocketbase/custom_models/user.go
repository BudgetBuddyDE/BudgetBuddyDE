package custom_models

import (
	"github.com/pocketbase/pocketbase/models"
	"github.com/pocketbase/pocketbase/tools/types"
)

var _ models.Model = (*User)(nil)

// This user model is not complete, it is just used for the account deletion and therefore only contains the necessary fields.
type User struct {
	models.BaseModel

	// Username          string         `db:"username" json:"username"`
	// Email             string         `db:"email" json:"email"`
	// Name              string         `db:"name" json:"name"`
	// Surname           string         `db:"surname" json:"surname"`
	MarkedForDeletion types.DateTime `db:"marked_for_deletion" json:"marked_for_deletion"`
}

func (m *User) TableName() string {
	return "users"
}
