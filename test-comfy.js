const http = require('http');

const workflow = {
  "3": { "class_type": "KSampler", "inputs": { "seed": Math.floor(Math.random() * 1000000), "steps": 20, "cfg": 7, "sampler_name": "euler", "scheduler": "normal", "denoise": 1, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0] } },
  "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": "v1-5-pruned-emaonly-fp16.safetensors" } },
  "5": { "class_type": "EmptyLatentImage", "inputs": { "width": 512, "height": 512, "batch_size": 1 } },
  "6": { "class_type": "CLIPTextEncode", "inputs": { "text": "a professional high-tech JARVIS logo, glowing cyan on black background, 8k resolution", "clip": ["4", 1] } },
  "7": { "class_type": "CLIPTextEncode", "inputs": { "text": "low quality, blurry", "clip": ["4", 1] } },
  "8": { "class_type": "VAEDecode", "inputs": { "samples": ["3", 0], "vae": ["4", 2] } },
  "9": { "class_type": "SaveImage", "inputs": { "filename_prefix": "JARVIS_TEST", "images": ["8", 0] } }
};

const data = JSON.stringify({ prompt: workflow });

const options = {
  hostname: '127.0.0.1',
  port: 8188,
  path: '/prompt',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Sending test prompt to ComfyUI...');
const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      const response = JSON.parse(body);
      console.log('Success! Prompt ID:', response.prompt_id);
      console.log('JARVIS: ComfyUI has accepted the command. The 3090 is now painting, Sir.');
    } else {
      console.error('Error:', res.statusCode, body);
    }
  });
});

req.on('error', (e) => {
  console.error('ComfyUI Connection Failed:', e.message);
});

req.write(data);
req.end();
