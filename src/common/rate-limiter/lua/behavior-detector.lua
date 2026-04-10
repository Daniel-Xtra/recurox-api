-- Behavior Detector Rate Limiter
-- Key 1: failures:resource:identifier
-- Key 2: blocked:resource:identifier
-- ARGV[1]: Failure threshold
-- ARGV[2]: Block duration (seconds)
-- ARGV[3]: Failure window (seconds)

local failureKey = KEYS[1]
local blockedKey = KEYS[2]
local threshold = tonumber(ARGV[1])
local blockDuration = tonumber(ARGV[2])
local window = tonumber(ARGV[3])

-- Check if already blocked
if redis.call('EXISTS', blockedKey) == 1 then
    return {1, redis.call('TTL', blockedKey)} -- [is_blocked, ttl]
end

-- Increment failure count
local count = redis.call('INCR', failureKey)

-- Set window if it's a new key
if count == 1 then
    redis.call('EXPIRE', failureKey, window)
end

-- Check if threshold exceeded
if count >= threshold then
    redis.call('SET', blockedKey, '1', 'EX', blockDuration)
    return {1, blockDuration}
end

return {0, 0}
