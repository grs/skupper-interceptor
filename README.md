## A simple proof-of-concept of a skupper interceptor

The following steps assume a working skupper namespace.

First deploy some kind of service. I use a simple http echo that
returns whatever is POSTed to it:

```
kubectl create deployment echo-impl --image quay.io/gordons/http-echo --port 8080
```

Expose this via skupper:

```
skupper expose --protocol http deployment echo-impl
```

Now create another skupper service that will be the first stage in the chain:

```
skupper service create echo 8080 --mapping http
```

Deploy the interceptor (update the env vars if changing either of the
service names above):

```
kubectl apply -f https://raw.githubusercontent.com/grs/skupper-interceptor/main/interceptor.yaml
```

Then bind this to the entry service:

```
skupper service bind echo deployment my-interceptor
```

Calls to http://echo:8080 within the cluster now go through the
interceptor to the echo-impl pod. The interceptor in this example
obfucates certain words (apple bananan and grape on requests, red,
yellow and green on responses).

E.g.

```
$ kubectl run -it --image quay.io/gordons/fedora:30 test
If you don't see a command prompt, try pressing enter.
[root@test /]# curl -d $'purple grapes and green apples\n' http://echo:8080/
purple *****s and ##### *****s
[root@test /]# curl -d $'no fruit for me thanks\n' http://echo:8080/
no fruit for me thanks
```


