# 003
WebGLスクールの第三回の課題

## Requirements
地球上を飛ぶ旅客機（を模した Box や Plane 等で可）の動きを実現してみましょう。
課題の実装ポイントは「旅客機のような見た目ではなく」、あくまでも「旅客機のような動き」です。
余裕があれば地球上に建築されたビルや、山脈などの自然物なんかも追加してみてもいいかもしれません。

## Engines
```
node: 18.13.0
npm: 8.19.3
```

## Setup
```
npm ci
```

## Scripts
- `dev` ローカルサーバ起動
- `build` ビルド

## Memo
ハマったこととか
- 複数のカメラをrenderしようとした時、[WebGLRenderer.autoClear](https://threejs.org/docs/#api/en/renderers/WebGLRenderer.autoClear)をfalseにする
  - この辺り、scissorとか使う方法もあるみたい
- 追従カメラを作る時、カメラの天地が反転してしまってたけど、lookAtだでなく、[up](https://threejs.org/docs/#api/en/core/Object3D.up)を設定してあげる
- カメラヘルパーはsceneに追加する（追従カメラをGroupに追加したけどヘルパー自体はsceneでOK）

## References
- [webgl_camera example](https://threejs.org/examples/#webgl_camera)
- [WebGL開発に役立つ重要な三角関数の数式・概念まとめ（Three.js編）](https://ics.media/entry/10657/)
