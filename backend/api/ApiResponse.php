<?php
/**
 * API 響應類
 * 統一管理 API 響應格式
 */

class ApiResponse {
    private $statusCode = 200;
    private $data = [];
    private $message = '';
    private $errors = [];

    /**
     * 設置狀態碼
     * @param int $code - HTTP 狀態碼
     * @return $this
     */
    public function setStatusCode($code) {
        $this->statusCode = $code;
        http_response_code($code);
        return $this;
    }

    /**
     * 設置數據
     * @param mixed $data - 響應數據
     * @return $this
     */
    public function setData($data) {
        $this->data = $data;
        return $this;
    }

    /**
     * 設置消息
     * @param string $message - 響應消息
     * @return $this
     */
    public function setMessage($message) {
        $this->message = $message;
        return $this;
    }

    /**
     * 設置錯誤
     * @param array|string $errors - 錯誤信息
     * @return $this
     */
    public function setErrors($errors) {
        $this->errors = is_array($errors) ? $errors : [$errors];
        return $this;
    }

    /**
     * 成功響應
     * @param mixed $data - 響應數據
     * @param string $message - 成功消息
     * @return string - JSON 字串
     */
    public function success($data = [], $message = 'Success') {
        return $this->setStatusCode(200)
            ->setData($data)
            ->setMessage($message)
            ->send();
    }

    /**
     * 建立成功響應
     * @param mixed $data - 創建的數據
     * @param string $message - 消息
     * @return string - JSON 字串
     */
    public function created($data = [], $message = 'Created successfully') {
        return $this->setStatusCode(201)
            ->setData($data)
            ->setMessage($message)
            ->send();
    }

    /**
     * 驗證失敗響應
     * @param array $errors - 驗證錯誤
     * @return string - JSON 字串
     */
    public function unprocessable($errors = []) {
        return $this->setStatusCode(422)
            ->setErrors($errors)
            ->setMessage('Validation failed')
            ->send();
    }

    /**
     * 錯誤響應
     * @param string $message - 錯誤消息
     * @param int $code - HTTP 狀態碼
     * @return string - JSON 字串
     */
    public function error($message = 'Error', $code = 400) {
        return $this->setStatusCode($code)
            ->setMessage($message)
            ->send();
    }

    /**
     * 未找到響應
     * @param string $message - 錯誤消息
     * @return string - JSON 字串
     */
    public function notFound($message = 'Resource not found') {
        return $this->setStatusCode(404)
            ->setMessage($message)
            ->send();
    }

    /**
     * 未授權響應
     * @param string $message - 錯誤消息
     * @return string - JSON 字串
     */
    public function unauthorized($message = 'Unauthorized') {
        return $this->setStatusCode(401)
            ->setMessage($message)
            ->send();
    }

    /**
     * 發送響應
     * @return string - JSON 字串
     */
    public function send() {
        header('Content-Type: application/json; charset=utf-8');

        $response = [
            'success' => $this->statusCode >= 200 && $this->statusCode < 300,
            'status' => $this->statusCode,
            'message' => $this->message,
        ];

        if (!empty($this->data)) {
            $response['data'] = $this->data;
        }

        if (!empty($this->errors)) {
            $response['errors'] = $this->errors;
        }

        echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }
}
