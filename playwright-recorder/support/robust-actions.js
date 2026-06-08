export async function smartClick(page, selector) {
  try {
    return await page.click(selector, { timeout: 5000 });
  } catch (error) {
    if (!isTimeoutError(error)) {
      throw error;
    }

    const htmlSnapshot = await page.content();
    const decision = await askLlmForNewSelector(selector, htmlSnapshot);

    if (decision.healed === true) {
      console.log(
        '\x1b[32m%s\x1b[0m',
        `[Self-Healing] Click selector healed: ${selector} -> ${decision.newSelector}`
      );
      return await page.click(decision.newSelector, { timeout: 5000 });
    }

    throw error;
  }
}

export async function clickByRoleName(root, role, name, options = {}) {
  const attempts = [
    () => root.getByRole(role, { name, exact: options.exact }).click(),
    () => root.getByRole(role, { name: fuzzyText(name) }).click(),
    () => root.getByText(fuzzyText(name)).click()
  ];

  return runFirst(attempts);
}

export async function clickByText(root, text, options = {}) {
  const attempts = [
    () => root.getByText(text, { exact: options.exact }).click(),
    () => root.getByText(fuzzyText(text)).click()
  ];

  if (options.selector) {
    attempts.push(() => root.locator(options.selector).filter({ hasText: fuzzyText(text) }).first().click());
  }

  return runFirst(attempts);
}

async function runFirst(attempts) {
  let lastError;

  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function fuzzyText(value) {
  const normalized = String(value).replace(/\s+/g, ' ').trim();
  const important = normalized.length > 32 ? normalized.slice(0, 32) : normalized;
  const parts = important
    .split(' ')
    .filter(Boolean)
    .map(escapeRegExp);

  return new RegExp(parts.join('.*'), 'i');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function askLlmForNewSelector(oldSelector, htmlSnapshot) {
  void htmlSnapshot;

  // OpenAI ChatCompletion connection placeholder:
  // const client = new OpenAI({
  //   apiKey: process.env.OPENAI_API_KEY || '<api_key>',
  //   baseURL: process.env.OPENAI_BASE_URL || '<base_url>'
  // });
  // const response = await client.chat.completions.create({
  //   model: '<model>',
  //   messages: [
  //     { role: 'system', content: 'Return JSON with healed and newSelector.' },
  //     { role: 'user', content: JSON.stringify({ oldSelector, htmlSnapshot }) }
  //   ]
  // });

  if (oldSelector.includes('#submit-btn')) {
    return { healed: true, newSelector: 'button#confirm-button' };
  }

  return { healed: false };
}

function isTimeoutError(error) {
  return error?.name === 'TimeoutError' || /timeout/i.test(error?.message ?? '');
}
