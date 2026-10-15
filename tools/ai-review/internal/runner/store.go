package runner

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/smithy-go"
	"github.com/budgetbuddyde/budgetbuddyde/tools/ai-review/internal/review"
)

type stored struct {
	Identity string        `json:"identity"`
	Report   review.Report `json:"report"`
}

type store struct {
	client *s3.Client
	bucket string
}

func newStore(ctx context.Context, bucket string) (store, error) {
	cfg, err := awsconfig.LoadDefaultConfig(ctx, awsconfig.WithHTTPClient(httpClient()), awsconfig.WithRequestChecksumCalculation(aws.RequestChecksumCalculationWhenRequired))
	if err != nil {
		return store{}, err
	}
	return store{s3.NewFromConfig(cfg), bucket}, nil
}

func (s store) load(ctx context.Context, key string) (*stored, error) {
	result, err := s.client.GetObject(ctx, &s3.GetObjectInput{Bucket: aws.String(s.bucket), Key: aws.String(key)})
	if err != nil {
		var api smithy.APIError
		if errors.As(err, &api) && api.ErrorCode() == "NoSuchKey" {
			return nil, nil
		}
		return nil, fmt.Errorf("S3 read failed")
	}
	defer result.Body.Close()
	b, err := io.ReadAll(io.LimitReader(result.Body, 4*1024*1024+1))
	if err != nil || len(b) > 4*1024*1024 {
		return nil, fmt.Errorf("invalid stored report size")
	}
	var data stored
	if err := strictJSON(b, &data); err != nil {
		return nil, err
	}
	return &data, nil
}

func (s store) save(ctx context.Context, key string, data stored) error {
	b, err := json.Marshal(data)
	if err != nil {
		return err
	}
	_, err = s.client.PutObject(ctx, &s3.PutObjectInput{Bucket: aws.String(s.bucket), Key: aws.String(key), Body: bytes.NewReader(b), IfNoneMatch: aws.String("*"), ContentType: aws.String("application/json")})
	if err != nil {
		return fmt.Errorf("S3 conditional write failed; rerun to load existing result")
	}
	return nil
}
