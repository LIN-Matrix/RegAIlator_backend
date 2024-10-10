import openai # TODO: Replace with Llama3
import os

def get_prompt():
    # 获取当前的路径
    dir_path = os.path.dirname(os.path.realpath(__file__))
    # 从 prompt_start.in, prompt_end.in 等文件中读取并拼接成 prompt
    prompt_start = open(f'{dir_path}/../include/prompt/prompt_start.in', 'r').read()
    prompt_examples = ""
    # 读取 prompt/examples 文件夹下 exp1.in, exp5.in
    for i in [1, 22]:
        prompt_examples += open(f'{dir_path}/../include/prompt/examples/exp{i}.in', 'r').read()
    prompt_end = open(f'{dir_path}/../include/prompt/prompt_end.in', 'r').read()
    return prompt_start + prompt_examples + prompt_end

def from_text_to_general_template_using_llm(text, input_length=16385, answer_length=4096):
        dir_path = os.path.dirname(os.path.realpath(__file__))
        openai.api_key = open(f'{dir_path}/../include/openai_key.in', 'r').read()
        prompt = get_prompt()
        # 给 text 做截断处理
        text = text[:input_length] # This model's maximum context length is 16385 tokens.
        
        response1 = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": text},
                ],
            max_tokens=answer_length,  # 控制生成的回复长度(最大为4096)
            temperature=0.1,  # 控制生成文本的创造性（0-1之间，越高越随机）
        )
        return response1.choices[0].message.content