package custom_models

import (
	"github.com/pocketbase/pocketbase/models"
	"github.com/pocketbase/pocketbase/tools/types"
)

var _ models.Model = (*Transaction)(nil)

type Transaction struct {
	models.BaseModel

	Owner          string         `db:"owner" json:"owner"`
	Category       string         `db:"category" json:"category"`
	PaymentMethod  string         `db:"payment_method" json:"payment_method"`
	ProcessedAt    types.DateTime `db:"processed_at" json:"processed_at"`
	Receiver       string         `db:"receiver" json:"receiver"`
	Information    string         `db:"information" json:"information"`
	TransferAmount float64        `db:"transfer_amount" json:"transfer_amount"`
	// Attachment     []string       `db:"attachments" json:"attachments"`
}

func (m *Transaction) TableName() string {
	return "transactions"
}
