/* 
// NOT WORKING YET
export async function fetchAPI(endpoint: string): Promise<any> {
    const response = await fetch(`/api/${endpoint}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${endpoint}`);
    }
    return response.json();

}*/