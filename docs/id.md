#### ID组成

1. 41bit存储timestamp
2. 5bit存储shard值
3. 7bit存储自增序列值

#### 根据ID反推上述每个值
1. timestamp = ID >> 12 (实际时间为our_epoch + timestamp，单位ms)
2. shard = (ID >> 7) - (ID >> 12 << 5) (右位移为阶段取值，左位移为右边补齐0)
3. serial = ID - (ID >> 7 << 7)
