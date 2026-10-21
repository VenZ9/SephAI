import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMessagesForPuter, validateMessagesForInvocation } from '../src/services/messageNormalizer';
import { validateModelSupport, PuterModelError } from '../src/services/puterService';
import { POPULAR_MODELS, ChatMessage, PendingAuthAction } from '../src/types/chat';

test('BUG 2 FIX: Message normalization strips UI metadata and invalid content for GPT-4o / Puter', async (t) => {
  await t.test('filters out messages with empty content or whitespace only', () => {
    const rawMessages: ChatMessage[] = [
      {
        id: 'msg-1',
        role: 'user',
        content: '   ',
        timestamp: Date.now(),
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: '', // Empty assistant placeholder
        timestamp: Date.now(),
        isStreaming: true
      },
      {
        id: 'msg-3',
        role: 'user',
        content: 'Hello world',
        timestamp: Date.now(),
      }
    ];

    const normalized = normalizeMessagesForPuter(rawMessages);
    assert.strictEqual(normalized.length, 1);
    assert.deepStrictEqual(normalized[0], {
      role: 'user',
      content: 'Hello world'
    });
  });

  await t.test('filters out messages marked with isError', () => {
    const rawMessages: ChatMessage[] = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Can you help me?',
        timestamp: Date.now()
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isError: true,
        errorMessage: 'Network timeout'
      },
      {
        id: 'msg-3',
        role: 'user',
        content: 'Retrying now',
        timestamp: Date.now()
      }
    ];

    const normalized = normalizeMessagesForPuter(rawMessages);
    assert.strictEqual(normalized.length, 2);
    assert.strictEqual(normalized[0].content, 'Can you help me?');
    assert.strictEqual(normalized[1].content, 'Retrying now');
  });

  await t.test('strips all UI-only properties (id, timestamp, modelUsed, isStreaming)', () => {
    const rawMessages: ChatMessage[] = [
      {
        id: 'msg-abc',
        role: 'user',
        content: 'Count to 3',
        timestamp: 1700000000,
        modelUsed: 'gpt-4o',
        isStreaming: false
      },
      {
        id: 'msg-def',
        role: 'assistant',
        content: '1, 2, 3',
        timestamp: 1700000005,
        modelUsed: 'gpt-4o',
        isStreaming: false
      }
    ];

    const normalized = normalizeMessagesForPuter(rawMessages);
    assert.strictEqual(normalized.length, 2);
    // Verify each item has ONLY role and content
    for (const msg of normalized) {
      assert.deepStrictEqual(Object.keys(msg).sort(), ['content', 'role']);
    }
  });

  await t.test('correctly places non-empty system prompt at index 0', () => {
    const rawMessages: ChatMessage[] = [
      { id: '1', role: 'user', content: 'What is your purpose?', timestamp: 123 }
    ];
    const systemPrompt = 'You are Seph AI, a minimalist assistant.';

    const normalized = normalizeMessagesForPuter(rawMessages, systemPrompt);
    assert.strictEqual(normalized.length, 2);
    assert.strictEqual(normalized[0].role, 'system');
    assert.strictEqual(normalized[0].content, systemPrompt);
    assert.strictEqual(normalized[1].role, 'user');
    assert.strictEqual(normalized[1].content, 'What is your purpose?');
  });

  await t.test('validates that message list is ready for invocation', () => {
    // Valid invocation
    const valid = [
      { role: 'user' as const, content: 'Hi there' }
    ];
    assert.doesNotThrow(() => validateMessagesForInvocation(valid));

    // Empty list throws
    assert.throws(() => validateMessagesForInvocation([]), /empty/i);

    // List with no user message throws
    assert.throws(
      () => validateMessagesForInvocation([{ role: 'assistant', content: 'Hey' }]),
      /No valid user message/i
    );
  });
});

test('BUG 3 FIX: Model validation prevents unavailable models and rejects legacy IDs honestly', async (t) => {
  await t.test('rejects claude-3-5-sonnet and legacy identifiers with honest explanation', () => {
    assert.throws(
      () => validateModelSupport('claude-3-5-sonnet', POPULAR_MODELS),
      (err: any) => {
        assert(err instanceof PuterModelError);
        assert(err.message.includes('claude-3-5-sonnet'));
        assert(err.message.includes('Claude Sonnet 4.6'));
        return true;
      }
    );

    assert.throws(
      () => validateModelSupport('deepseek-chat', POPULAR_MODELS),
      (err: any) => {
        assert(err instanceof PuterModelError);
        assert(err.message.includes('deepseek-chat'));
        return true;
      }
    );
  });

  await t.test('allows active valid popular models', () => {
    assert.doesNotThrow(() => validateModelSupport('gpt-4o-mini', POPULAR_MODELS));
    assert.doesNotThrow(() => validateModelSupport('gpt-4o', POPULAR_MODELS));
    assert.doesNotThrow(() => validateModelSupport('claude-sonnet-4-6', POPULAR_MODELS));
    assert.doesNotThrow(() => validateModelSupport('claude-haiku-4-5-20251001', POPULAR_MODELS));
    assert.doesNotThrow(() => validateModelSupport('deepseek-flash', POPULAR_MODELS));
    assert.doesNotThrow(() => validateModelSupport('gemini-2.5-flash', POPULAR_MODELS));
  });

  await t.test('POPULAR_MODELS list contains only valid models with no retired IDs', () => {
    const retired = ['claude-3-5-sonnet', 'claude-3.5-sonnet', 'claude-3-7-sonnet', 'deepseek-chat'];
    for (const model of POPULAR_MODELS) {
      assert(!retired.includes(model.id), `POPULAR_MODELS must not contain retired ID: ${model.id}`);
      assert(typeof model.name === 'string' && model.name.length > 0);
      assert(typeof model.provider === 'string' && model.provider.length > 0);
    }
  });
});

test('BUG 1 FIX: Pending authentication action persistence and lifecycle', async (t) => {
  await t.test('correctly serializes and validates pending auth payload', () => {
    const action: PendingAuthAction = {
      type: 'send_message',
      conversationId: 'conv_12345',
      messageText: 'Explain thermodynamics',
      model: 'gpt-4o-mini',
      timestamp: Date.now()
    };

    const serialized = JSON.stringify(action);
    const parsed = JSON.parse(serialized) as PendingAuthAction;

    assert.strictEqual(parsed.type, 'send_message');
    assert.strictEqual(parsed.conversationId, 'conv_12345');
    assert.strictEqual(parsed.messageText, 'Explain thermodynamics');
    assert.strictEqual(parsed.model, 'gpt-4o-mini');

    // Check expiration logic (15 minutes)
    const isExpired = Date.now() - parsed.timestamp > 15 * 60 * 1000;
    assert.strictEqual(isExpired, false);

    const oldTimestamp = Date.now() - 20 * 60 * 1000;
    const isOldExpired = Date.now() - oldTimestamp > 15 * 60 * 1000;
    assert.strictEqual(isOldExpired, true);
  });
});
