import argparse
import tqdm
import sys
from src.llm import from_text_to_general_template_using_llm
from src.adaptor import from_general_template_to_xlsx
from src.parse import extract_text_from_pdf
from src.test import test_accuracy
import os

def get_prompt():
    # 获取当前的路径
    dir_path = os.path.dirname(os.path.realpath(__file__))
    # 从 prompt_start.in, prompt_end.in 等文件中读取并拼接成 prompt
    prompt_start = open(f'{dir_path}/./include/prompt_tags/prompt_start.in', 'r').read()
    prompt_examples = ""
    # 读取 prompt/examples 文件夹下 exp1.in
    for i in [1, 2]:
        prompt_examples += open(f'{dir_path}/./include/prompt_tags/examples/exp{i}.in', 'r').read()
    prompt_end = open(f'{dir_path}/./include/prompt_tags/prompt_end.in', 'r').read()
    return prompt_start + prompt_examples + prompt_end

def read_text_file(txt_path):
    """Reads the provided text file."""
    with open(txt_path, 'r', encoding='utf-8') as file:
        return file.read()

def read_pdfs_and_concatenate(n, input_paths):
    """Reads n PDFs and concatenates their text."""
    full_text = ""
    for i in range(n):
        input_path = input_paths[i]
        text, _ = extract_text_from_pdf(input_path)
        full_text += text  # Concatenate the text from each PDF
    return full_text

if __name__ == '__main__':
    # Parse the command-line arguments
    parser = argparse.ArgumentParser(description="Read a text file and multiple PDF files, then process them.")
    parser.add_argument('txt_path', type=str, help='Path to the text file')
    parser.add_argument('n', type=int, help='Number of PDF files to process')
    parser.add_argument('pdf_paths', nargs='*', help='List of PDF file paths')
    args = parser.parse_args()

    # Read the provided text file
    text_from_txt = read_text_file(args.txt_path)

    if args.n == 0:
        concatenated_text = text_from_txt
    else:
        # Validate the number of PDF paths
        if len(args.pdf_paths) != args.n:
            print(f"Error: Expected {args.n} PDF files, but got {len(args.pdf_paths)}.")
            sys.exit(1)
        # Concatenate the text from the given PDF files
        concatenated_text = text_from_txt + read_pdfs_and_concatenate(args.n, args.pdf_paths)

    # Process the concatenated text with the LLM
    result = from_text_to_general_template_using_llm(concatenated_text, get_prompt())
    print(result)
