export function buildQueryString(params: Record<string, string | number | boolean | null | undefined>): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            searchParams.append(key, String(value));
        }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : "";
}
