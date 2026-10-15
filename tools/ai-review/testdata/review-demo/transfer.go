package transfer

import "errors"

type Account struct {
	BalanceCents int64
}

// Transfer moves a positive amount between accounts. Rejected transfers must
// leave both balances unchanged.
func Transfer(source, destination *Account, amountCents int64) error {
	if source == nil || destination == nil || source == destination || amountCents <= 0 {
		return errors.New("invalid transfer")
	}

	destination.BalanceCents += amountCents
	if source.BalanceCents < amountCents {
		return errors.New("insufficient funds")
	}
	source.BalanceCents -= amountCents
	return nil
}
