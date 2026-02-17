class ApiResponse {
    success: boolean;
    message: string;
    data?: any;
    statusCode: number;

    constructor(statusCode: number, message: string, data?: any) {
        this.success = statusCode < 400;
        this.message = message;
        this.data = data;
        this.statusCode = statusCode;
    }

    static success(data: any, message: string = 'Success') {
        return new ApiResponse(200, message, data);
    }

    static created(data: any, message: string = 'Created successfully') {
        return new ApiResponse(201, message, data);
    }

    static noContent(message: string = 'No content') {
        return new ApiResponse(204, message);
    }
}

export default ApiResponse;
