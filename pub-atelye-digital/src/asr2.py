import sys, json, wave, numpy as np, sherpa_onnx as so
M=sys.argv[1]; wav=sys.argv[2]; out=sys.argv[3]
w=wave.open(wav); sr=w.getframerate(); a=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768
cfg=so.VadModelConfig(); cfg.silero_vad.model=M+"/vad.onnx"; cfg.silero_vad.min_silence_duration=0.6; cfg.silero_vad.min_speech_duration=0.2; cfg.silero_vad.max_speech_duration=26; cfg.sample_rate=sr
vad=so.VoiceActivityDetector(cfg, buffer_size_in_seconds=200)
win=cfg.silero_vad.window_size; segs=[]
for i in range(0,len(a),win):
    vad.accept_waveform(a[i:i+win])
    while not vad.empty():
        segs.append((vad.front.start, np.array(vad.front.samples))); vad.pop()
vad.flush()
while not vad.empty(): segs.append((vad.front.start, np.array(vad.front.samples))); vad.pop()
d=M+"/sherpa-onnx-whisper-large-v3/large-v3-"
rec=so.OfflineRecognizer.from_whisper(encoder=d+"encoder.int8.onnx",decoder=d+"decoder.int8.onnx",tokens=d+"tokens.txt",language="ht",task="transcribe",num_threads=4,tail_paddings=1000)
res=[]
for st,smp in segs:
    s=rec.create_stream(); s.accept_waveform(sr,smp); rec.decode_stream(s)
    r={"start":st/sr,"end":(st+len(smp))/sr,"text":s.result.text.strip()}
    res.append(r); print(f"[{r['start']:6.2f}-{r['end']:6.2f}] {r['text']}",flush=True)
json.dump(res,open(out,"w"),ensure_ascii=False,indent=1)
