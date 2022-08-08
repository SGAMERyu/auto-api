import { useQuery } from "vue-query";
import { axios as fetch } from "./plugins";
// 查询平台物流方案详情
export function useGetApiSolutionDetailIdQuery() {
    return useQuery('getApiSolutionDetailId', () => fetch.get('/api/solution/detail/{id}'))
}
// 查询平台物流列表
export function usePostApiSolutionSearchQuery() {
    return useQuery('postApiSolutionSearch', () => fetch.post('/api/solution/search'))
}
